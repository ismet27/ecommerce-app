<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('Password123!');
        $business = Business::where('name', 'Tekno Mağaza')->first();

        User::query()->updateOrCreate(
            ['email' => 'admin@shop.local'],
            [
                'business_id' => null,
                'name' => 'Admin Kullanıcı',
                'password' => $password,
                'role' => User::ROLE_ADMIN,
                'is_active' => true,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'seller@shop.local'],
            [
                'business_id' => $business->id,
                'name' => 'Satıcı Kullanıcı',
                'password' => $password,
                'role' => User::ROLE_SELLER,
                'is_active' => true,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'customer@shop.local'],
            [
                'business_id' => null,
                'name' => 'Müşteri Kullanıcı',
                'password' => $password,
                'role' => User::ROLE_CUSTOMER,
                'is_active' => true,
            ]
        );
    }
}
