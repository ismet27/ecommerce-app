<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_succeeds(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'admin@shop.local',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonStructure(['token', 'token_type', 'user']);
    }

    public function test_seller_login_succeeds(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'seller@shop.local',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)->assertJsonPath('user.role', 'seller');
    }

    public function test_customer_login_succeeds(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'customer@shop.local',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)->assertJsonPath('user.role', 'customer');
    }

    public function test_wrong_password_returns_401(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'admin@shop.local',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
    }

    public function test_unknown_email_returns_401(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nobody@shop.local',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(401);
    }

    public function test_inactive_account_returns_403(): void
    {
        $user = User::where('email', 'customer@shop.local')->first();
        $user->update(['is_active' => false]);

        $response = $this->postJson('/api/login', [
            'email' => 'customer@shop.local',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(403);
    }

    public function test_me_requires_auth(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401);
    }

    public function test_me_returns_safe_user(): void
    {
        $user = User::where('email', 'admin@shop.local')->first();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/me');

        $response->assertStatus(200)
            ->assertJson([
                'id' => $user->id,
                'email' => 'admin@shop.local',
                'role' => 'admin',
                'is_active' => true,
            ])
            ->assertJsonMissing(['password'])
            ->assertJsonMissing(['remember_token']);
    }

    public function test_logout_revokes_token(): void
    {
        $user = User::where('email', 'admin@shop.local')->first();
        $token = $user->createToken('test')->plainTextToken;

        $logoutResponse = $this->withToken($token)->postJson('/api/logout');
        $logoutResponse->assertStatus(200);

        // Sanctum's request guard caches the resolved user for the lifetime
        // of the guard instance; forget it so the next call re-validates the
        // (now revoked) token against the database, as a real new request would.
        Auth::forgetGuards();

        $meResponse = $this->withToken($token)->getJson('/api/me');
        $meResponse->assertStatus(401);
    }

    public function test_logged_out_token_cannot_call_me(): void
    {
        $user = User::where('email', 'seller@shop.local')->first();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout')->assertStatus(200);
        Auth::forgetGuards();
        $this->withToken($token)->getJson('/api/me')->assertStatus(401);
    }
}
