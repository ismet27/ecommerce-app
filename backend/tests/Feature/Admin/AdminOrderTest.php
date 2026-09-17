<?php

namespace Tests\Feature\Admin;

use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActsWithTokens;
use Tests\TestCase;

class AdminOrderTest extends TestCase
{
    use ActsWithTokens, RefreshDatabase;

    public function test_admin_lists_all_orders(): void
    {
        $customer = User::where('email', 'customer@shop.local')->first();
        $product = Product::first();
        OrderService::createForCustomer($customer, [['product_id' => $product->id, 'quantity' => 1]], null);

        $this->withToken($this->adminToken())
            ->getJson('/api/admin/orders')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_shows_order_detail(): void
    {
        $customer = User::where('email', 'customer@shop.local')->first();
        $product = Product::first();
        $order = OrderService::createForCustomer($customer, [['product_id' => $product->id, 'quantity' => 1]], null);

        $this->withToken($this->adminToken())
            ->getJson("/api/admin/orders/{$order->id}")
            ->assertStatus(200)
            ->assertJsonPath('customer.email', 'customer@shop.local')
            ->assertJsonCount(1, 'items');
    }

    public function test_seller_and_customer_cannot_use_admin_order_routes(): void
    {
        $this->withToken($this->sellerToken())->getJson('/api/admin/orders')->assertStatus(403);
        $this->withToken($this->customerToken())->getJson('/api/admin/orders')->assertStatus(403);
    }
}
