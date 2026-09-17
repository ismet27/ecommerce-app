<?php

namespace Tests\Feature\Database;

use App\Models\Business;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class Phase2MssqlTest extends TestCase
{
    use RefreshDatabase;

    public function test_driver_is_sqlsrv(): void
    {
        $this->assertSame('sqlsrv', DB::connection()->getDriverName());
        $this->assertNotSame('sqlite', config('database.default'));
    }

    public function test_database_name_is_ecommerce_app(): void
    {
        $this->assertSame('ecommerce_app', DB::selectOne('SELECT DB_NAME() AS name')->name);
    }

    public function test_turkish_unicode_round_trip(): void
    {
        $business = Business::create([
            'name' => 'Öğrenci İşletmesi Çorum Şık',
            'is_active' => true,
        ]);

        $this->assertSame('Öğrenci İşletmesi Çorum Şık', $business->refresh()->name);
    }

    public function test_relationships_are_valid(): void
    {
        $seller = User::where('email', 'seller@shop.local')->first();
        $this->assertSame('Tekno Mağaza', $seller->business->name);

        $product = Product::first();
        $this->assertNotNull($product->category);
        $this->assertNotNull($product->business);
    }

    public function test_no_sqlite_fallback(): void
    {
        $this->assertNotSame(':memory:', config('database.connections.sqlsrv.database'));
        $this->assertSame('ecommerce_app', config('database.connections.sqlsrv.database'));
    }
}
