<?php

namespace Tests\Feature\Orders;

use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActsWithTokens;
use Tests\TestCase;

class CustomerOrderTest extends TestCase
{
    use ActsWithTokens, RefreshDatabase;

    public function test_customer_lists_own_orders(): void
    {
        $customer = User::where('email', 'customer@shop.local')->first();
        $product = Product::first();
        OrderService::createForCustomer($customer, [['product_id' => $product->id, 'quantity' => 1]], null);

        $this->withToken($this->customerToken())
            ->getJson('/api/orders')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_customer_shows_own_order(): void
    {
        $customer = User::where('email', 'customer@shop.local')->first();
        $product = Product::first();
        $order = OrderService::createForCustomer($customer, [['product_id' => $product->id, 'quantity' => 1]], 'not for whipped cream');

        $this->withToken($this->customerToken())
            ->getJson("/api/orders/{$order->id}")
            ->assertStatus(200)
            ->assertJsonPath('customer_note', 'not for whipped cream');
    }

    public function test_cannot_see_another_customers_order(): void
    {
        $customer = User::where('email', 'customer@shop.local')->first();
        $product = Product::first();
        $order = OrderService::createForCustomer($customer, [['product_id' => $product->id, 'quantity' => 1]], null);

        $otherCustomer = User::create([
            'business_id' => null,
            'name' => 'Diğer Müşteri',
            'email' => 'othercustomer@shop.local',
            'password' => 'Password123!',
            'role' => User::ROLE_CUSTOMER,
            'is_active' => true,
        ]);
        $otherToken = $otherCustomer->createToken('test')->plainTextToken;

        $this->withToken($otherToken)
            ->getJson("/api/orders/{$order->id}")
            ->assertStatus(404);
    }

    public function test_status_filter_works(): void
    {
        $customer = User::where('email', 'customer@shop.local')->first();
        $product = Product::first();
        OrderService::createForCustomer($customer, [['product_id' => $product->id, 'quantity' => 1]], null);

        $this->withToken($this->customerToken())
            ->getJson('/api/orders?status=received')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $this->withToken($this->customerToken())
            ->getJson('/api/orders?status=completed')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}
