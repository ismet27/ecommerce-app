<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $business = Business::where('name', 'Tekno Mağaza')->first();

        $products = [
            ['name' => 'Kablosuz Kulaklık', 'category' => 'Elektronik', 'description' => 'Gürültü önleyici kablosuz kulaklık, 20 saat pil ömrü.', 'price' => 1299.90, 'stock' => 45],
            ['name' => 'Mekanik Klavye', 'category' => 'Bilgisayar', 'description' => 'RGB aydınlatmalı mekanik klavye, Türkçe Q düzeni.', 'price' => 1499.00, 'stock' => 30],
            ['name' => 'Oyuncu Mouse', 'category' => 'Bilgisayar', 'description' => 'Yüksek DPI oyuncu mouse, 6 programlanabilir tuş.', 'price' => 699.50, 'stock' => 60],
            ['name' => 'Laptop Standı', 'category' => 'Aksesuar', 'description' => 'Alüminyum ayarlanabilir laptop standı.', 'price' => 349.00, 'stock' => 80],
            ['name' => 'USB-C Hub', 'category' => 'Aksesuar', 'description' => '7 in 1 USB-C çoklayıcı, HDMI ve kart okuyucu içerir.', 'price' => 549.90, 'stock' => 50],
            ['name' => 'Telefon Kılıfı', 'category' => 'Telefon', 'description' => 'Darbe emici silikon telefon kılıfı.', 'price' => 149.90, 'stock' => 120],
            ['name' => 'Powerbank', 'category' => 'Telefon', 'description' => '20000 mAh hızlı şarj destekli powerbank.', 'price' => 799.00, 'stock' => 40],
            ['name' => 'Web Kamera', 'category' => 'Bilgisayar', 'description' => '1080p Full HD otomatik odaklamalı web kamerası.', 'price' => 899.90, 'stock' => 35],
            ['name' => 'Monitör', 'category' => 'Elektronik', 'description' => '27 inç 144Hz Full HD oyuncu monitörü.', 'price' => 6499.00, 'stock' => 15],
            ['name' => 'Bluetooth Hoparlör', 'category' => 'Elektronik', 'description' => 'Taşınabilir su geçirmez bluetooth hoparlör.', 'price' => 899.00, 'stock' => 55],
            ['name' => 'Mekanik Klavye Kol Altlığı', 'category' => 'Aksesuar', 'description' => 'Jel dolgulu bilek destek pedi.', 'price' => 199.00, 'stock' => 70],
            ['name' => 'Telefon Ekran Koruyucu', 'category' => 'Telefon', 'description' => 'Temperli cam ekran koruyucu, 2li paket.', 'price' => 99.90, 'stock' => 150],
        ];

        foreach ($products as $item) {
            $category = Category::where('name', $item['category'])->first();

            Product::query()->updateOrCreate(
                ['slug' => Str::slug($item['name'])],
                [
                    'business_id' => $business->id,
                    'category_id' => $category->id,
                    'name' => $item['name'],
                    'description' => $item['description'],
                    'price' => $item['price'],
                    'stock' => $item['stock'],
                    'is_active' => true,
                ]
            );
        }
    }
}
