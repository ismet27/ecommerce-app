<?php

namespace Tests\Feature\Orders;

use App\Models\Business;
use App\Models\Category;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActsWithTokens;
use Tests\TestCase;

class SellerOrderTest extends TestCase
{
    use ActsWithTokens, RefreshDatabase;

    private function createOtherBusinessProduct(): Product
    {
        $otherBusiness = Business::create(['name' => 'Rakip İşletme', 'is_active' => true]);
        $category = Category::where('name', 'Elektronik')->first();

        return Product::create([
            'business_id' => $otherBusiness->id,
            'category_id' => $category->id,
            'name' => 'Rakip Ürün',
            'slug' => 'rakip-urun-order',
            'price' => 75,
            'stock' => 20,
            'is_active' => true,
        ]);
    }

    private function multiBusinessOrder(): array
    {
        $customer = User::where('email', 'customer@shop.local')->first();
        $ownProduct = Product::where('name', 'Telefon Kılıfı')->first();
        $otherProduct = $this->createOtherBusinessProduct();

        $order = OrderService::createForCustomer($customer, [
            ['product_id' => $ownProduct->id, 'quantity' => 1],
            ['product_id' => $otherProduct->id, 'quantity' => 1],
        ], null);

        return [$order, $ownProduct, $otherProduct];
    }

    public function test_seller_sees_only_own_business_items(): void
    {
        [$order, $ownProduct, $otherProduct] = $this->multiBusinessOrder();

        $response = $this->withToken($this->sellerToken())->getJson("/api/seller/orders/{$order->id}");

        $response->assertStatus(200);
        $names = collect($response->json('items'))->pluck('product_name_snapshot');
        $this->assertTrue($names->contains($ownProduct->name));
        $this->assertFalse($names->contains($otherProduct->name));
    }

    public function test_seller_does_not_see_competitor_item_details(): void
    {
        [$order] = $this->multiBusinessOrder();

        $response = $this->withToken($this->sellerToken())->getJson("/api/seller/orders/{$order->id}");

        $response->assertStatus(200)->assertJsonCount(1, 'items');
    }

    public function test_received_to_preparing_is_valid(): void
    {
        $item = $this->ownOrderItem();

        $this->withToken($this->sellerToken())
            ->patchJson("/api/seller/order-items/{$item->id}/status", ['status' => 'preparing'])
            ->assertStatus(200)
            ->assertJsonPath('status', 'preparing');
    }

    public function test_preparing_to_completed_is_valid(): void
    {
        $item = $this->ownOrderItem();
        $item->update(['status' => 'preparing']);

        $this->withToken($this->sellerToken())
            ->patchJson("/api/seller/order-items/{$item->id}/status", ['status' => 'completed'])
            ->assertStatus(200)
            ->assertJsonPath('status', 'completed');
    }

    public function test_cancelled_transition_works(): void
    {
        $item = $this->ownOrderItem();

        $this->withToken($this->sellerToken())
            ->patchJson("/api/seller/order-items/{$item->id}/status", ['status' => 'cancelled'])
            ->assertStatus(200)
            ->assertJsonPath('status', 'cancelled');
    }

    public function test_invalid_backward_transition_rejected(): void
    {
        $item = $this->ownOrderItem();
        $item->update(['status' => 'completed']);

        $this->withToken($this->sellerToken())
            ->patchJson("/api/seller/order-items/{$item->id}/status", ['status' => 'received'])
            ->assertStatus(409);
    }

    public function test_seller_cannot_update_other_business_item(): void
    {
        [$order, $ownProduct, $otherProduct] = $this->multiBusinessOrder();

        $otherItem = OrderItem::where('order_id', $order->id)
            ->where('product_id', $otherProduct->id)
            ->first();

        $this->withToken($this->sellerToken())
            ->patchJson("/api/seller/order-items/{$otherItem->id}/status", ['status' => 'preparing'])
            ->assertStatus(404);
    }

    public function test_inactive_business_seller_blocked_from_orders(): void
    {
        Business::where('name', 'Tekno Mağaza')->first()->update(['is_active' => false]);

        $this->withToken($this->sellerToken())
            ->getJson('/api/seller/orders')
            ->assertStatus(403);
    }

    public function test_cancel_restores_stock_exactly_once(): void
    {
        $product = Product::where('name', 'Telefon Kılıfı')->first();
        $originalStock = $product->stock;

        $customer = User::where('email', 'customer@shop.local')->first();
        $order = OrderService::createForCustomer($customer, [['product_id' => $product->id, 'quantity' => 2]], null);
        $this->assertSame($originalStock - 2, $product->refresh()->stock);

        $item = $order->items()->where('product_id', $product->id)->first();

        $this->withToken($this->sellerToken())
            ->patchJson("/api/seller/order-items/{$item->id}/status", ['status' => 'cancelled'])
            ->assertStatus(200);

        $this->assertSame($originalStock, $product->refresh()->stock);

        // Attempting to cancel again (already terminal) must be rejected,
        // and must not restore stock a second time.
        $this->withToken($this->sellerToken())
            ->patchJson("/api/seller/order-items/{$item->id}/status", ['status' => 'cancelled'])
            ->assertStatus(409);

        $this->assertSame($originalStock, $product->refresh()->stock);
    }

    private function ownOrderItem(): OrderItem
    {
        $customer = User::where('email', 'customer@shop.local')->first();
        $product = Product::where('name', 'Telefon Kılıfı')->first();
        $order = OrderService::createForCustomer($customer, [['product_id' => $product->id, 'quantity' => 1]], null);

        return $order->items()->first();
    }
}
