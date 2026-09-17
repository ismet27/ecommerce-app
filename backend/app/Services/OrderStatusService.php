<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;

/**
 * Derives an order's aggregate status from the statuses of its items.
 *
 * Rule (documented, deterministic):
 *   1. If ANY item is "preparing"            -> order = preparing
 *   2. Else if ALL items are "cancelled"     -> order = cancelled
 *   3. Else if ANY remaining (non-cancelled) item is "received" -> order = received
 *   4. Otherwise (remaining non-cancelled items are all "completed") -> order = completed
 *
 * This also covers the documented mixed case: completed + cancelled with
 * nothing "preparing" resolves to "completed" once cancelled items are
 * excluded from consideration.
 */
class OrderStatusService
{
    /**
     * @param  string[]  $itemStatuses
     */
    public static function determine(array $itemStatuses): string
    {
        if (in_array(OrderItem::STATUS_PREPARING, $itemStatuses, true)) {
            return Order::STATUS_PREPARING;
        }

        $nonCancelled = array_values(array_filter(
            $itemStatuses,
            fn (string $status) => $status !== OrderItem::STATUS_CANCELLED
        ));

        if ($nonCancelled === []) {
            return Order::STATUS_CANCELLED;
        }

        if (in_array(OrderItem::STATUS_RECEIVED, $nonCancelled, true)) {
            return Order::STATUS_RECEIVED;
        }

        return Order::STATUS_COMPLETED;
    }

    public static function recalculate(Order $order): Order
    {
        $statuses = $order->items()->pluck('status')->all();

        $newStatus = self::determine($statuses);

        if ($newStatus !== $order->status) {
            $order->update(['status' => $newStatus]);
        }

        return $order;
    }
}
