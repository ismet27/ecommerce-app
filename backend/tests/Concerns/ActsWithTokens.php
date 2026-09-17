<?php

namespace Tests\Concerns;

use App\Models\User;

trait ActsWithTokens
{
    protected function tokenFor(string $email): string
    {
        return User::where('email', $email)->first()->createToken('test')->plainTextToken;
    }

    protected function adminToken(): string
    {
        return $this->tokenFor('admin@shop.local');
    }

    protected function sellerToken(): string
    {
        return $this->tokenFor('seller@shop.local');
    }

    protected function customerToken(): string
    {
        return $this->tokenFor('customer@shop.local');
    }
}
