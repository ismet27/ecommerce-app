<?php

namespace Tests\Feature\Orders;

use App\Models\Business;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActsWithTokens;
use Tests\TestCase;

class OrderCreationTest extends TestCase
{
    use ActsWithTokens, RefreshDatabase;

    public function test_customer_creates_valid_order(): void
    {
        $product = Product::where('name', 'Telefon Kılıfı')->first();

        $response = $this->withToken($this->customerToken())->postJson('/api/orders', [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ]);

        $response->assertStatus(201)->assertJsonPath('status', 'received');
    }

    public function test_seller_forbidden_from_creating_order(): void
    {
        $product = Product::first();

        $this->withToken($this->sellerToken())->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertStatus(403);
    }

    public function test_admin_forbidden_from_creating_order(): void
    {
        $product = Product::first();

        $this->withToken($this->adminToken())->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertStatus(403);
    }

    public function test_server_ignores_client_submitted_price(): void
    {
        $product = Product::where('name', 'Powerbank')->first();

        $response = $this->withToken($this->customerToken())->postJson('/api/orders', [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 0.01, 'price' => 0.01],
            ],
        ]);

        $response->assertStatus(201);
        $this->assertSame((string) $product->price, $response->json('items.0.unit_price_snapshot'));
    }

    public function test_total_is_calculated_correctly(): void
    {
        $productA = Product::where('name', 'Telefon Ekran Koruyucu')->first(); // 99.90
        $productB = Product::where('name', 'Oyuncu Mouse')->first(); // 699.50

        $response = $this->withToken($this->customerToken())->postJson('/api/orders', [
            'items' => [
                ['product_id' => $productA->id, 'quantity' => 2], // 199.80
                ['product_id' => $productB->id, 'quantity' => 3], // 2098.50
            ],
        ]);

        $response->assertStatus(201)->assertJsonPath('total_amount', '2298.30');
    }

    public function test_snapshots_are_correct(): void
    {
        $product = Product::where('name', 'Mekanik Klavye')->first();

        $response = $this->withToken($this->customerToken())->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('items.0.product_name_snapshot', $product->name)
            ->assertJsonPath('items.0.unit_price_snapshot', (string) $product->price)
            ->assertJsonPath('items.0.quantity', 1)
            ->assertJsonPath('items.0.line_total', (string) $product->price);
    }

    public function test_stock_is_decremented(): void
    {
        $product = Product::where('name', 'USB-C Hub')->first();
        $originalStock = $product->stock;

        $this->withToken($this->customerToken())->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 3]],
        ])->assertStatus(201);

        $this->assertSame($originalStock - 3, $product->refresh()->stock);
    }

    public function test_insufficient_stock_rejected(): void
    {
        $product = Product::where('name', 'Monitör')->first();

        $this->withToken($this->customerToken())->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => $product->stock + 1]],
        ])->assertStatus(422);

        $this->assertDatabaseMissing('orders', ['user_id' => \App\Models\User::where('email', 'customer@shop.local')->first()->id]);
    }

    public function test_failed_order_rolls_back_all_changes(): void
    {
        $validProduct = Product::where('name', 'Bluetooth Hoparlör')->first();
        $invalidProduct = Product::where('name', 'Monitör')->first();
        $originalStock = $validProduct->stock;

        $this->withToken($this->customerToken())->postJson('/api/orders', [
            'items' => [
                ['product_id' => $validProduct->id, 'quantity' => 1],
                ['product_id' => $invalidProduct->id, 'quantity' => $invalidProduct->stock + 1],
            ],
        ])->assertStatus(422);

        $this->assertSame($originalStock, $validProduct->refresh()->stock);
        $this->assertDatabaseCount('order_items', 0);
    }

    public function test_inactive_product_rejected(): void
    {
        $product = Product::where('name', 'Laptop Standı')->first();
        $product->update(['is_active' => false]);

        $this->withToken($this->customerToken())->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertStatus(422);
    }

    public function test_inactive_category_rejected(): void
    {
        $product = Product::where('name', 'Laptop Standı')->first();
        $product->category->update(['is_active' => false]);

        $this->withToken($this->customerToken())->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertStatus(422);
    }

    public function test_inactive_business_rejected(): void
    {
        Business::where('name', 'Tekno Mağaza')->first()->update(['is_active' => false]);
        $product = Product::first();

        $this->withToken($this->customerToken())->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertStatus(422);
    }

    public function test_duplicate_product_ids_rejected(): void
    {
        $product = Product::where('name', 'Telefon Kılıfı')->first();

        $this->withToken($this->customerToken())->postJson('/api/orders', [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ])->assertStatus(422);
    }

    public function test_nonexistent_product_id_rejected(): void
    {
        $this->withToken($this->customerToken())->postJson('/api/orders', [
            'items' => [['product_id' => 999999, 'quantity' => 1]],
        ])->assertStatus(422);
    }

    public function test_decimal_money_is_exact(): void
    {
        $category = Category::where('name', 'Elektronik')->first();
        $business = Business::where('name', 'Tekno Mağaza')->first();

        $product = Product::create([
            'business_id' => $business->id,
            'category_id' => $category->id,
            'name' => 'Ondalık Test Ürünü',
            'slug' => 'ondalik-test-urunu',
            'price' => 49.99,
            'stock' => 100,
            'is_active' => true,
        ]);

        $response = $this->withToken($this->customerToken())->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 3]],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('total_amount', '149.97')
            ->assertJsonPath('items.0.line_total', '149.97');
    }
}
