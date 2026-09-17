<?php

namespace Tests\Feature\Admin;

use App\Models\Business;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActsWithTokens;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use ActsWithTokens, RefreshDatabase;

    public function test_admin_lists_categories(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/admin/categories')
            ->assertStatus(200)
            ->assertJsonCount(4, 'data');
    }

    public function test_admin_creates_category(): void
    {
        $response = $this->withToken($this->adminToken())->postJson('/api/admin/categories', [
            'name' => 'Ev & Yaşam',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'Ev & Yaşam')
            ->assertJsonPath('slug', 'ev-yasam');
    }

    public function test_admin_updates_category(): void
    {
        $category = Category::where('name', 'Elektronik')->first();

        $response = $this->withToken($this->adminToken())->putJson("/api/admin/categories/{$category->id}", [
            'description' => 'Güncellendi',
        ]);

        $response->assertStatus(200)->assertJsonPath('description', 'Güncellendi');
    }

    public function test_admin_deactivates_category(): void
    {
        $category = Category::where('name', 'Elektronik')->first();

        $response = $this->withToken($this->adminToken())->patchJson("/api/admin/categories/{$category->id}", [
            'is_active' => false,
        ]);

        $response->assertStatus(200)->assertJsonPath('is_active', false);
        $this->assertDatabaseHas('categories', ['id' => $category->id, 'is_active' => false]);
    }

    public function test_inactive_category_excluded_from_catalog(): void
    {
        $category = Category::where('name', 'Elektronik')->first();
        $productCount = Product::where('category_id', $category->id)->where('is_active', true)->count();
        $this->assertGreaterThan(0, $productCount);

        $category->update(['is_active' => false]);

        $response = $this->getJson('/api/catalog/products?per_page=100');
        $response->assertStatus(200);

        foreach ($response->json('data') as $product) {
            $this->assertNotSame('Elektronik', $product['category']['name'] ?? null);
        }
    }
}
