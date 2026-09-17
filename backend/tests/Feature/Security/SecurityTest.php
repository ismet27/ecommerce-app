<?php

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_never_returned_from_login(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'admin@shop.local',
            'password' => 'Password123!',
        ]);

        $response->assertJsonMissingPath('user.password');
        $this->assertArrayNotHasKey('password', $response->json('user'));
    }

    public function test_remember_token_never_returned(): void
    {
        $user = User::where('email', 'admin@shop.local')->first();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/me');

        $this->assertArrayNotHasKey('remember_token', $response->json());
    }

    public function test_raw_sanctum_token_hash_never_returned(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'admin@shop.local',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200);
        $plainToken = $response->json('token');

        // The plain-text token returned to the client must not equal the
        // hashed value stored in personal_access_tokens.
        $tokenId = explode('|', $plainToken)[0];
        $stored = DB::table('personal_access_tokens')->find($tokenId);

        $this->assertNotNull($stored);
        $this->assertNotSame($plainToken, $stored->token);
        $this->assertArrayNotHasKey('token_hash', $response->json());
    }

    public function test_unsupported_role_middleware_value_fails_safely(): void
    {
        $user = User::where('email', 'admin@shop.local')->first();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/test/unsupported-role');

        $response->assertStatus(403);
    }
}
