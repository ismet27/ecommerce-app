<?php

namespace Tests\Feature\Admin;

use App\Models\Business;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActsWithTokens;
use Tests\TestCase;

class BusinessManagementTest extends TestCase
{
    use ActsWithTokens, RefreshDatabase;

    public function test_admin_lists_businesses(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/admin/businesses')
            ->assertStatus(200)
            ->assertJsonPath('data.0.name', fn ($name) => is_string($name));
    }

    public function test_seller_forbidden_from_admin_businesses(): void
    {
        $this->withToken($this->sellerToken())
            ->getJson('/api/admin/businesses')
            ->assertStatus(403);
    }

    public function test_customer_forbidden_from_admin_businesses(): void
    {
        $this->withToken($this->customerToken())
            ->getJson('/api/admin/businesses')
            ->assertStatus(403);
    }

    public function test_admin_creates_business(): void
    {
        $response = $this->withToken($this->adminToken())->postJson('/api/admin/businesses', [
            'name' => 'Yeni Mağaza',
            'description' => 'Test işletmesi',
            'phone' => '+90 555 000 0000',
            'email' => 'yeni@magaza.local',
        ]);

        $response->assertStatus(201)->assertJsonPath('name', 'Yeni Mağaza');
        $this->assertDatabaseHas('businesses', ['name' => 'Yeni Mağaza', 'is_active' => true]);
    }

    public function test_admin_updates_business(): void
    {
        $business = Business::where('name', 'Tekno Mağaza')->first();

        $response = $this->withToken($this->adminToken())->putJson("/api/admin/businesses/{$business->id}", [
            'phone' => '+90 555 111 2233',
        ]);

        $response->assertStatus(200)->assertJsonPath('phone', '+90 555 111 2233');
    }

    public function test_admin_deactivates_business(): void
    {
        $business = Business::where('name', 'Tekno Mağaza')->first();

        $response = $this->withToken($this->adminToken())->patchJson("/api/admin/businesses/{$business->id}", [
            'is_active' => false,
        ]);

        $response->assertStatus(200)->assertJsonPath('is_active', false);
        $this->assertDatabaseHas('businesses', ['id' => $business->id, 'is_active' => false]);

        // Products/users/orders must not be deleted by deactivation.
        $this->assertDatabaseHas('users', ['business_id' => $business->id]);
        $this->assertGreaterThan(0, $business->products()->count());
    }

    public function test_inactive_business_blocks_seller_operation(): void
    {
        $business = Business::where('name', 'Tekno Mağaza')->first();
        $business->update(['is_active' => false]);

        $this->withToken($this->sellerToken())
            ->getJson('/api/seller/products')
            ->assertStatus(403);
    }

    public function test_admin_business_search_and_filter(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/admin/businesses?search=Tekno')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Tekno Mağaza']);

        $this->withToken($this->adminToken())
            ->getJson('/api/admin/businesses?is_active=0')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}
