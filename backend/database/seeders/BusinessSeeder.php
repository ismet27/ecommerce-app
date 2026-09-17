<?php

namespace Database\Seeders;

use App\Models\Business;
use Illuminate\Database\Seeder;

class BusinessSeeder extends Seeder
{
    public function run(): void
    {
        Business::query()->updateOrCreate(
            ['name' => 'Tekno Mağaza'],
            [
                'description' => 'Elektronik ve bilgisayar aksesuarları satan demo işletme.',
                'phone' => '+90 212 555 0101',
                'email' => 'info@teknomagaza.local',
                'is_active' => true,
            ]
        );
    }
}
