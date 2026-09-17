<?php

namespace Tests\Feature\Models;

use App\Models\Business;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModelRelationshipTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_has_many_products(): void
    {
        $business = Business::where('name', 'Tekno Mağaza')->first();

        $this->assertGreaterThan(0, $business->products()->count());
        $this->assertInstanceOf(Product::class, $business->products->first());
    }

    public function test_product_belongs_to_category(): void
    {
        $product = Product::first();

        $this->assertInstanceOf(Category::class, $product->category);
    }

    public function test_product_belongs_to_business(): void
    {
        $product = Product::first();

        $this->assertInstanceOf(Business::class, $product->business);
    }

    public function test_user_orders_relationship_works_structurally(): void
    {
        $customer = User::where('email', 'customer@shop.local')->first();
        $product = Product::first();

        $order = Order::create([
            'user_id' => $customer->id,
            'status' => Order::STATUS_RECEIVED,
            'total_amount' => $product->price,
            'customer_note' => 'Test order',
        ]);

        $this->assertTrue($customer->orders->contains($order));
        $this->assertInstanceOf(User::class, $order->user);
    }

    public function test_order_items_relationship_works_structurally(): void
    {
        $customer = User::where('email', 'customer@shop.local')->first();
        $product = Product::first();

        $order = Order::create([
            'user_id' => $customer->id,
            'status' => Order::STATUS_RECEIVED,
            'total_amount' => $product->price * 2,
            'customer_note' => null,
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'business_id' => $product->business_id,
            'product_name_snapshot' => $product->name,
            'unit_price_snapshot' => $product->price,
            'quantity' => 2,
            'line_total' => $product->price * 2,
            'status' => OrderItem::STATUS_RECEIVED,
        ]);

        $this->assertTrue($order->items->contains($item));
        $this->assertInstanceOf(Order::class, $item->order);
        $this->assertInstanceOf(Product::class, $item->product);
        $this->assertInstanceOf(Business::class, $item->business);
    }
}
