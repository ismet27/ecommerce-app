<?php

namespace Tests\Feature\Middleware;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(string $email): string
    {
        return User::where('email', $email)->first()->createToken('test')->plainTextToken;
    }

    public function test_admin_passes_admin_middleware(): void
    {
        $token = $this->tokenFor('admin@shop.local');

        $this->withToken($token)->getJson('/api/test/admin-only')->assertStatus(200);
    }

    public function test_seller_blocked_by_admin_middleware(): void
    {
        $token = $this->tokenFor('seller@shop.local');

        $this->withToken($token)->getJson('/api/test/admin-only')->assertStatus(403);
    }

    public function test_customer_blocked_by_admin_middleware(): void
    {
        $token = $this->tokenFor('customer@shop.local');

        $this->withToken($token)->getJson('/api/test/admin-only')->assertStatus(403);
    }

    public function test_seller_passes_seller_middleware(): void
    {
        $token = $this->tokenFor('seller@shop.local');

        $this->withToken($token)->getJson('/api/test/seller-only')->assertStatus(200);
    }

    public function test_admin_blocked_by_seller_only_middleware_unless_combined(): void
    {
        $adminToken = $this->tokenFor('admin@shop.local');

        $this->withToken($adminToken)->getJson('/api/test/seller-only')->assertStatus(403);
        $this->withToken($adminToken)->getJson('/api/test/seller-or-admin')->assertStatus(200);

        $sellerToken = $this->tokenFor('seller@shop.local');
        $this->withToken($sellerToken)->getJson('/api/test/seller-or-admin')->assertStatus(200);
    }

    public function test_customer_passes_customer_middleware(): void
    {
        $token = $this->tokenFor('customer@shop.local');

        $this->withToken($token)->getJson('/api/test/customer-only')->assertStatus(200);
    }

    public function test_inactive_token_holder_blocked_by_active_middleware(): void
    {
        $user = User::where('email', 'customer@shop.local')->first();
        $token = $user->createToken('test')->plainTextToken;

        $user->update(['is_active' => false]);

        $this->withToken($token)->getJson('/api/test/active-only')->assertStatus(403);
    }
}
