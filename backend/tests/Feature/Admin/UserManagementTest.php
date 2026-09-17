<?php

namespace Tests\Feature\Admin;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActsWithTokens;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use ActsWithTokens, RefreshDatabase;

    public function test_admin_lists_users(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/admin/users')
            ->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_creates_seller_with_business(): void
    {
        $business = Business::where('name', 'Tekno Mağaza')->first();

        $response = $this->withToken($this->adminToken())->postJson('/api/admin/users', [
            'name' => 'Yeni Satıcı',
            'email' => 'seller2@shop.local',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'seller',
            'business_id' => $business->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('role', 'seller')
            ->assertJsonPath('business_id', $business->id)
            ->assertJsonMissingPath('password');
    }

    public function test_seller_creation_requires_business(): void
    {
        $response = $this->withToken($this->adminToken())->postJson('/api/admin/users', [
            'name' => 'Satıcısız',
            'email' => 'nobusiness@shop.local',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'seller',
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_creates_customer(): void
    {
        $response = $this->withToken($this->adminToken())->postJson('/api/admin/users', [
            'name' => 'Yeni Müşteri',
            'email' => 'customer2@shop.local',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'customer',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('role', 'customer')
            ->assertJsonPath('business_id', null);
    }

    public function test_admin_updates_user_role(): void
    {
        $business = Business::where('name', 'Tekno Mağaza')->first();
        $customer = User::where('email', 'customer@shop.local')->first();

        $response = $this->withToken($this->adminToken())->patchJson("/api/admin/users/{$customer->id}", [
            'role' => 'seller',
            'business_id' => $business->id,
        ]);

        $response->assertStatus(200)->assertJsonPath('role', 'seller');
    }

    public function test_deactivating_user_revokes_tokens(): void
    {
        $customer = User::where('email', 'customer@shop.local')->first();
        $customer->createToken('customer-session');
        $this->assertSame(1, $customer->tokens()->count());

        $this->withToken($this->adminToken())->patchJson("/api/admin/users/{$customer->id}", [
            'is_active' => false,
        ])->assertStatus(200);

        $this->assertSame(0, $customer->tokens()->count());
    }

    public function test_admin_cannot_self_deactivate(): void
    {
        $admin = User::where('email', 'admin@shop.local')->first();

        $this->withToken($this->adminToken())->patchJson("/api/admin/users/{$admin->id}", [
            'is_active' => false,
        ])->assertStatus(422);

        $this->assertDatabaseHas('users', ['id' => $admin->id, 'is_active' => true]);
    }

    public function test_admin_cannot_self_demote(): void
    {
        $admin = User::where('email', 'admin@shop.local')->first();

        $this->withToken($this->adminToken())->patchJson("/api/admin/users/{$admin->id}", [
            'role' => 'customer',
        ])->assertStatus(422);

        $this->assertDatabaseHas('users', ['id' => $admin->id, 'role' => 'admin']);
    }

    public function test_last_active_admin_protection(): void
    {
        // Create a second admin, then demoting them individually is fine
        // (one active admin always remains) but the demoted admin cannot
        // then remove the very last remaining admin either.
        $secondAdminResponse = $this->withToken($this->adminToken())->postJson('/api/admin/users', [
            'name' => 'İkinci Admin',
            'email' => 'admin2@shop.local',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'admin',
        ]);
        $secondAdminResponse->assertStatus(201);
        $secondAdminId = $secondAdminResponse->json('id');

        // Demoting the second admin is fine: the first admin remains active.
        $this->withToken($this->adminToken())->patchJson("/api/admin/users/{$secondAdminId}", [
            'role' => 'customer',
        ])->assertStatus(200);

        // Now only one active admin exists; attempting to remove that
        // last admin (acting on itself) must be rejected.
        $admin = User::where('email', 'admin@shop.local')->first();
        $this->withToken($this->adminToken())->patchJson("/api/admin/users/{$admin->id}", [
            'is_active' => false,
        ])->assertStatus(422);
    }

    public function test_admin_password_reset_hashes_and_revokes_tokens(): void
    {
        $seller = User::where('email', 'seller@shop.local')->first();
        $seller->createToken('seller-session');
        $this->assertSame(1, $seller->tokens()->count());
        $originalHash = $seller->password;

        $this->withToken($this->adminToken())->patchJson("/api/admin/users/{$seller->id}", [
            'password' => 'NewPassword456!',
            'password_confirmation' => 'NewPassword456!',
        ])->assertStatus(200);

        $seller->refresh();
        $this->assertNotSame($originalHash, $seller->password);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('NewPassword456!', $seller->password));
        $this->assertSame(0, $seller->tokens()->count());
    }
}
