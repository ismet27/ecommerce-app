<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * Allowed order-item status transitions. Anything not listed here
     * (including "same status" and any transition away from a terminal
     * status) is rejected.
     */
    private const TRANSITIONS = [
        OrderItem::STATUS_RECEIVED => [OrderItem::STATUS_PREPARING, OrderItem::STATUS_CANCELLED],
        OrderItem::STATUS_PREPARING => [OrderItem::STATUS_COMPLETED, OrderItem::STATUS_CANCELLED],
    ];

    /**
     * Create an order for a customer from client-submitted items.
     * Prices, totals, and business_id are always computed server-side.
     *
     * @param  array<int, array{product_id: int, quantity: int}>  $items
     */
    public static function createForCustomer(User $customer, array $items, ?string $customerNote): Order
    {
        return DB::transaction(function () use ($customer, $items, $customerNote) {
            $productIds = array_column($items, 'product_id');

            // Lock the candidate product rows for the duration of the
            // transaction so concurrent orders cannot oversell stock.
            $products = Product::whereIn('id', $productIds)
                ->with(['category', 'business'])
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $totalCents = 0;
            $orderItemsData = [];

            foreach ($items as $line) {
                $product = $products->get($line['product_id']);

                if (! $product) {
                    throw ValidationException::withMessages([
                        'items' => ["Product #{$line['product_id']} is not available."],
                    ]);
                }

                if (! $product->is_active || ! $product->category?->is_active || ! $product->business?->is_active) {
                    throw ValidationException::withMessages([
                        'items' => ["Product \"{$product->name}\" is not currently available."],
                    ]);
                }

                if ($product->stock < $line['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => ["Insufficient stock for \"{$product->name}\"."],
                    ]);
                }

                $lineTotalCents = Money::lineTotalCents($product->price, $line['quantity']);
                $totalCents += $lineTotalCents;

                $orderItemsData[] = [
                    'product' => $product,
                    'quantity' => $line['quantity'],
                    'unit_price_snapshot' => $product->price,
                    'line_total' => Money::fromCents($lineTotalCents),
                ];
            }

            $order = Order::create([
                'user_id' => $customer->id,
                'status' => Order::STATUS_RECEIVED,
                'total_amount' => Money::fromCents($totalCents),
                'customer_note' => $customerNote,
            ]);

            foreach ($orderItemsData as $data) {
                /** @var Product $product */
                $product = $data['product'];

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'business_id' => $product->business_id,
                    'product_name_snapshot' => $product->name,
                    'unit_price_snapshot' => $data['unit_price_snapshot'],
                    'quantity' => $data['quantity'],
                    'line_total' => $data['line_total'],
                    'status' => OrderItem::STATUS_RECEIVED,
                ]);

                $product->decrement('stock', $data['quantity']);
            }

            return $order->load('items');
        });
    }

    public static function canTransition(string $from, string $to): bool
    {
        return in_array($to, self::TRANSITIONS[$from] ?? [], true);
    }

    /**
     * Transition an order item to a new status, restoring stock exactly
     * once if the item is being cancelled for the first time (guaranteed
     * by the transition table only ever allowing a single move into the
     * terminal "cancelled" status), then recalculate the parent order's
     * aggregate status.
     */
    public static function transitionItemStatus(OrderItem $item, string $newStatus): OrderItem
    {
        if (! in_array($newStatus, OrderItem::STATUSES, true)) {
            throw ValidationException::withMessages([
                'status' => ['Invalid status.'],
            ]);
        }

        if (! self::canTransition($item->status, $newStatus)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition from \"{$item->status}\" to \"{$newStatus}\"."],
            ])->status(409);
        }

        return DB::transaction(function () use ($item, $newStatus) {
            $locked = OrderItem::whereKey($item->id)->lockForUpdate()->first();

            if (! self::canTransition($locked->status, $newStatus)) {
                throw ValidationException::withMessages([
                    'status' => ["Cannot transition from \"{$locked->status}\" to \"{$newStatus}\"."],
                ])->status(409);
            }

            if ($newStatus === OrderItem::STATUS_CANCELLED) {
                $product = Product::whereKey($locked->product_id)->lockForUpdate()->first();

                if ($product) {
                    $product->increment('stock', $locked->quantity);
                }
            }

            $locked->update(['status' => $newStatus]);

            OrderStatusService::recalculate($locked->order);

            return $locked->fresh();
        });
    }
}
