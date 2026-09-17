<?php

namespace Tests\Feature\Orders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Services\OrderStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderAggregationTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_completed_yields_completed(): void
    {
        $this->assertSame(
            Order::STATUS_COMPLETED,
            OrderStatusService::determine(['completed', 'completed'])
        );
    }

    public function test_all_cancelled_yields_cancelled(): void
    {
        $this->assertSame(
            Order::STATUS_CANCELLED,
            OrderStatusService::determine(['cancelled', 'cancelled'])
        );
    }

    public function test_any_preparing_yields_preparing(): void
    {
        $this->assertSame(
            Order::STATUS_PREPARING,
            OrderStatusService::determine(['received', 'preparing', 'completed'])
        );
    }

    public function test_mixed_completed_and_cancelled_yields_completed(): void
    {
        // Documented rule: once "preparing" is absent and cancelled items
        // are excluded from consideration, if every remaining item is
        // completed the order is considered completed.
        $this->assertSame(
            Order::STATUS_COMPLETED,
            OrderStatusService::determine(['completed', 'cancelled', 'completed'])
        );
    }

    public function test_mixed_received_and_completed_yields_received(): void
    {
        $this->assertSame(
            Order::STATUS_RECEIVED,
            OrderStatusService::determine(['received', 'completed'])
        );
    }

    public function test_order_status_updates_when_all_items_completed(): void
    {
        $order = Order::create(['user_id' => 1, 'status' => Order::STATUS_RECEIVED, 'total_amount' => 10]);
        OrderItem::insert([
            ['order_id' => $order->id, 'product_id' => 1, 'business_id' => 1, 'product_name_snapshot' => 'A', 'unit_price_snapshot' => 5, 'quantity' => 1, 'line_total' => 5, 'status' => 'completed', 'created_at' => now(), 'updated_at' => now()],
            ['order_id' => $order->id, 'product_id' => 2, 'business_id' => 1, 'product_name_snapshot' => 'B', 'unit_price_snapshot' => 5, 'quantity' => 1, 'line_total' => 5, 'status' => 'completed', 'created_at' => now(), 'updated_at' => now()],
        ]);

        OrderStatusService::recalculate($order);

        $this->assertSame(Order::STATUS_COMPLETED, $order->refresh()->status);
    }
}
