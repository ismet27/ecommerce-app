<?php

namespace Tests\Feature\Catalog;

use App\Models\Business;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_eligible_products_visible(): void
    {
        $response = $this->getJson('/api/catalog/products?per_page=100');
        $response->assertStatus(200);

        $this->assertSame(
            Product::where('is_active', true)->count(),
            count($response->json('data'))
        );
    }

    public function test_inactive_product_hidden(): void
    {
        $product = Product::where('name', 'Monitör')->first();
        $product->update(['is_active' => false]);

        $this->getJson("/api/catalog/products/{$product->id}")->assertStatus(404);
    }

    public function test_soft_deleted_product_hidden(): void
    {
        $product = Product::where('name', 'Web Kamera')->first();
        $product->delete();

        $this->getJson("/api/catalog/products/{$product->id}")->assertStatus(404);
    }

    public function test_inactive_category_product_hidden(): void
    {
        $category = Category::where('name', 'Telefon')->first();
        $category->update(['is_active' => false]);

        $response = $this->getJson('/api/catalog/products?per_page=100');

        foreach ($response->json('data') as $product) {
            $this->assertNotSame('Telefon', $product['category']['name'] ?? null);
        }
    }

    public function test_inactive_business_product_hidden(): void
    {
        Business::where('name', 'Tekno Mağaza')->first()->update(['is_active' => false]);

        $this->getJson('/api/catalog/products?per_page=100')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_search_works(): void
    {
        $this->getJson('/api/catalog/products?search=Kulaklık')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Kablosuz Kulaklık']);
    }

    public function test_category_filter_works(): void
    {
        $category = Category::where('name', 'Telefon')->first();

        $response = $this->getJson("/api/catalog/products?category_id={$category->id}&per_page=100");
        $response->assertStatus(200);

        foreach ($response->json('data') as $product) {
            $this->assertSame('Telefon', $product['category']['name']);
        }
    }

    public function test_price_filter_works(): void
    {
        $response = $this->getJson('/api/catalog/products?min_price=500&max_price=1000&per_page=100');
        $response->assertStatus(200);

        foreach ($response->json('data') as $product) {
            $price = (float) $product['price'];
            $this->assertGreaterThanOrEqual(500, $price);
            $this->assertLessThanOrEqual(1000, $price);
        }
    }

    public function test_in_stock_filter_works(): void
    {
        $product = Product::where('name', 'Monitör')->first();
        $product->update(['stock' => 0]);

        $response = $this->getJson('/api/catalog/products?in_stock=1&per_page=100');

        foreach ($response->json('data') as $item) {
            $this->assertGreaterThan(0, $item['stock']);
        }
    }

    public function test_detail_includes_images_category_business(): void
    {
        $product = Product::where('name', 'Kablosuz Kulaklık')->first();

        $response = $this->getJson("/api/catalog/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'id', 'name', 'slug', 'description', 'price', 'stock',
                'category' => ['id', 'name', 'slug'],
                'business' => ['id', 'name'],
                'images',
                'primary_image',
            ]);
    }
}
