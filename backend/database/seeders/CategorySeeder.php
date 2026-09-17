<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Elektronik' => 'Genel elektronik ürünler.',
            'Bilgisayar' => 'Bilgisayar ve bilgisayar aksesuarları.',
            'Telefon' => 'Telefon ve telefon aksesuarları.',
            'Aksesuar' => 'Genel teknoloji aksesuarları.',
        ];

        foreach ($categories as $name => $description) {
            Category::query()->updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'description' => $description,
                    'is_active' => true,
                ]
            );
        }
    }
}
