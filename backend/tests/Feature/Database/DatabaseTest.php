<?php

namespace Tests\Feature\Database;

use App\Models\Business;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_connection_is_sqlsrv(): void
    {
        $this->assertSame('sqlsrv', config('database.default'));
        $this->assertSame('sqlsrv', DB::connection()->getDriverName());
    }

    public function test_database_name_is_ecommerce_app(): void
    {
        $name = DB::selectOne('SELECT DB_NAME() AS name')->name;

        $this->assertSame('ecommerce_app', $name);
    }

    public function test_demo_users_exist(): void
    {
        $this->assertDatabaseHas('users', ['email' => 'admin@shop.local', 'role' => 'admin']);
        $this->assertDatabaseHas('users', ['email' => 'seller@shop.local', 'role' => 'seller']);
        $this->assertDatabaseHas('users', ['email' => 'customer@shop.local', 'role' => 'customer']);
    }

    public function test_demo_business_exists(): void
    {
        $this->assertDatabaseHas('businesses', ['name' => 'Tekno Mağaza']);
    }

    public function test_categories_exist(): void
    {
        $this->assertGreaterThanOrEqual(4, Category::count());
    }

    public function test_products_exist(): void
    {
        $this->assertGreaterThanOrEqual(10, Product::where('is_active', true)->count());
    }

    public function test_seller_belongs_to_business(): void
    {
        $seller = User::where('email', 'seller@shop.local')->first();

        $this->assertNotNull($seller->business_id);
        $this->assertInstanceOf(Business::class, $seller->business);
        $this->assertSame('Tekno Mağaza', $seller->business->name);
    }

    public function test_unicode_turkish_round_trip(): void
    {
        $business = Business::create([
            'name' => 'Çağdaş Şık Güzel İşletme İğdır',
            'description' => 'Türkçe karakter testi: ığĞÜşöçİ',
            'phone' => null,
            'email' => null,
            'is_active' => true,
        ]);

        $fresh = Business::find($business->id);

        $this->assertSame('Çağdaş Şık Güzel İşletme İğdır', $fresh->name);
        $this->assertSame('Türkçe karakter testi: ığĞÜşöçİ', $fresh->description);
    }
}
