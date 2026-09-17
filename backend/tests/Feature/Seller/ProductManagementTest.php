<?php

namespace Tests\Feature\Seller;

use App\Models\Business;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActsWithTokens;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use ActsWithTokens, RefreshDatabase;

    public function test_seller_lists_own_products(): void
    {
        $sellerBusinessId = User::where('email', 'seller@shop.local')->first()->business_id;

        $response = $this->withToken($this->sellerToken())->getJson('/api/seller/products?per_page=100');
        $response->assertStatus(200);

        foreach ($response->json('data') as $product) {
            $this->assertSame($sellerBusinessId, $product['business_id']);
        }
    }

    public function test_seller_creates_product(): void
    {
        $category = Category::where('name', 'Elektronik')->first();

        $response = $this->withToken($this->sellerToken())->postJson('/api/seller/products', [
            'category_id' => $category->id,
            'name' => 'Test Ürünü',
            'price' => 199.90,
            'stock' => 10,
        ]);

        $response->assertStatus(201)->assertJsonPath('name', 'Test Ürünü');
        $this->assertDatabaseHas('products', ['name' => 'Test Ürünü']);
    }

    public function test_business_id_is_server_controlled(): void
    {
        $category = Category::where('name', 'Elektronik')->first();
        $otherBusiness = Business::create(['name' => 'Başka İşletme', 'is_active' => true]);

        $response = $this->withToken($this->sellerToken())->postJson('/api/seller/products', [
            'category_id' => $category->id,
            'name' => 'Sahte Sahiplik',
            'price' => 10,
            'stock' => 1,
            'business_id' => $otherBusiness->id,
        ]);

        $response->assertStatus(201);
        $sellerBusinessId = User::where('email', 'seller@shop.local')->first()->business_id;
        $this->assertSame($sellerBusinessId, $response->json('business_id'));
    }

    public function test_seller_updates_own_product(): void
    {
        $product = Product::where('name', 'Kablosuz Kulaklık')->first();

        $response = $this->withToken($this->sellerToken())->putJson("/api/seller/products/{$product->id}", [
            'price' => 1399.90,
        ]);

        $response->assertStatus(200)->assertJsonPath('price', '1399.90');
    }

    public function test_seller_soft_deletes_own_product(): void
    {
        $product = Product::where('name', 'Powerbank')->first();

        $this->withToken($this->sellerToken())
            ->deleteJson("/api/seller/products/{$product->id}")
            ->assertStatus(204);

        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_seller_cannot_access_another_business_product(): void
    {
        $otherBusiness = Business::create(['name' => 'Rakip İşletme', 'is_active' => true]);
        $category = Category::where('name', 'Elektronik')->first();
        $otherProduct = Product::create([
            'business_id' => $otherBusiness->id,
            'category_id' => $category->id,
            'name' => 'Rakip Ürün',
            'slug' => 'rakip-urun',
            'price' => 50,
            'stock' => 5,
            'is_active' => true,
        ]);

        $this->withToken($this->sellerToken())
            ->getJson("/api/seller/products/{$otherProduct->id}")
            ->assertStatus(404);

        $this->withToken($this->sellerToken())
            ->putJson("/api/seller/products/{$otherProduct->id}", ['price' => 1])
            ->assertStatus(404);

        $this->withToken($this->sellerToken())
            ->deleteJson("/api/seller/products/{$otherProduct->id}")
            ->assertStatus(404);

        $this->assertDatabaseHas('products', ['id' => $otherProduct->id, 'deleted_at' => null]);
    }

    public function test_invalid_price_rejected(): void
    {
        $category = Category::where('name', 'Elektronik')->first();

        $this->withToken($this->sellerToken())->postJson('/api/seller/products', [
            'category_id' => $category->id,
            'name' => 'Negatif Fiyat',
            'price' => -5,
            'stock' => 1,
        ])->assertStatus(422);
    }

    public function test_invalid_stock_rejected(): void
    {
        $category = Category::where('name', 'Elektronik')->first();

        $this->withToken($this->sellerToken())->postJson('/api/seller/products', [
            'category_id' => $category->id,
            'name' => 'Negatif Stok',
            'price' => 10,
            'stock' => -1,
        ])->assertStatus(422);
    }

    public function test_inactive_business_seller_blocked(): void
    {
        Business::where('name', 'Tekno Mağaza')->first()->update(['is_active' => false]);

        $this->withToken($this->sellerToken())
            ->getJson('/api/seller/products')
            ->assertStatus(403);
    }
}
