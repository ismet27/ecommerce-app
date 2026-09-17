<?php

namespace Tests\Feature\Seller;

use App\Models\Business;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\ActsWithTokens;
use Tests\TestCase;

class ProductImageTest extends TestCase
{
    use ActsWithTokens, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    /**
     * A fresh, image-less product owned by the seeded seller — the seeded
     * demo products already carry one placeholder image each (see
     * ProductImageSeeder), which would confuse "first image becomes
     * primary" style assertions.
     */
    private function ownProduct(): Product
    {
        $seller = User::where('email', 'seller@shop.local')->first();
        $category = Category::where('name', 'Elektronik')->first();

        return Product::create([
            'business_id' => $seller->business_id,
            'category_id' => $category->id,
            'name' => 'Görselsiz Test Ürünü',
            'slug' => 'gorselsiz-test-urunu-'.uniqid(),
            'price' => 10,
            'stock' => 10,
            'is_active' => true,
        ]);
    }

    public function test_upload_jpg_png_webp(): void
    {
        $product = $this->ownProduct();

        foreach (['jpg', 'png', 'webp'] as $ext) {
            $file = UploadedFile::fake()->image("photo.{$ext}", 200, 200);

            $response = $this->withToken($this->sellerToken())
                ->postJson("/api/seller/products/{$product->id}/images", ['image' => $file]);

            $response->assertStatus(201);
        }

        $this->assertSame(3, $product->images()->count());
    }

    public function test_non_image_rejected(): void
    {
        $product = $this->ownProduct();
        $file = UploadedFile::fake()->create('malware.exe', 10, 'application/x-msdownload');

        $this->withToken($this->sellerToken())
            ->postJson("/api/seller/products/{$product->id}/images", ['image' => $file])
            ->assertStatus(422);
    }

    public function test_oversized_image_rejected(): void
    {
        $product = $this->ownProduct();
        $file = UploadedFile::fake()->image('big.jpg')->size(6 * 1024); // 6MB > 5MB limit

        $this->withToken($this->sellerToken())
            ->postJson("/api/seller/products/{$product->id}/images", ['image' => $file])
            ->assertStatus(422);
    }

    public function test_seller_cannot_upload_to_other_business_product(): void
    {
        $otherBusiness = Business::create(['name' => 'Rakip İşletme', 'is_active' => true]);
        $category = Category::where('name', 'Elektronik')->first();
        $otherProduct = Product::create([
            'business_id' => $otherBusiness->id,
            'category_id' => $category->id,
            'name' => 'Rakip Ürün',
            'slug' => 'rakip-urun-image',
            'price' => 50,
            'stock' => 5,
            'is_active' => true,
        ]);

        $file = UploadedFile::fake()->image('photo.jpg');

        $this->withToken($this->sellerToken())
            ->postJson("/api/seller/products/{$otherProduct->id}/images", ['image' => $file])
            ->assertStatus(404);
    }

    public function test_first_image_becomes_primary(): void
    {
        $product = $this->ownProduct();
        $file = UploadedFile::fake()->image('first.jpg');

        $response = $this->withToken($this->sellerToken())
            ->postJson("/api/seller/products/{$product->id}/images", ['image' => $file]);

        $response->assertStatus(201)->assertJsonPath('is_primary', true);
    }

    public function test_changing_primary_unsets_previous_primary(): void
    {
        $product = $this->ownProduct();
        $token = $this->sellerToken();

        $first = $this->withToken($token)->postJson("/api/seller/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->image('one.jpg'),
        ])->json();

        $second = $this->withToken($token)->postJson("/api/seller/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->image('two.jpg'),
        ])->json();

        $this->assertTrue($first['is_primary']);
        $this->assertFalse($second['is_primary']);

        $this->withToken($token)
            ->patchJson("/api/seller/products/{$product->id}/images/{$second['id']}", ['is_primary' => true])
            ->assertStatus(200)
            ->assertJsonPath('is_primary', true);

        $this->assertDatabaseHas('product_images', ['id' => $first['id'], 'is_primary' => false]);
        $this->assertDatabaseHas('product_images', ['id' => $second['id'], 'is_primary' => true]);
    }

    public function test_deleting_primary_promotes_another(): void
    {
        $product = $this->ownProduct();
        $token = $this->sellerToken();

        $first = $this->withToken($token)->postJson("/api/seller/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->image('one.jpg'),
        ])->json();

        $second = $this->withToken($token)->postJson("/api/seller/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->image('two.jpg'),
        ])->json();

        $this->withToken($token)
            ->deleteJson("/api/seller/products/{$product->id}/images/{$first['id']}")
            ->assertStatus(204);

        $this->assertDatabaseHas('product_images', ['id' => $second['id'], 'is_primary' => true]);
    }

    public function test_storage_file_removed_on_delete(): void
    {
        $product = $this->ownProduct();

        $image = $this->withToken($this->sellerToken())->postJson("/api/seller/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->image('deleteme.jpg'),
        ])->json();

        $path = \App\Models\ProductImage::find($image['id'])->path;
        Storage::disk('public')->assertExists($path);

        $this->withToken($this->sellerToken())
            ->deleteJson("/api/seller/products/{$product->id}/images/{$image['id']}")
            ->assertStatus(204);

        Storage::disk('public')->assertMissing($path);
    }

    public function test_image_url_is_safe(): void
    {
        $product = $this->ownProduct();

        $response = $this->withToken($this->sellerToken())->postJson("/api/seller/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->image('safe.jpg'),
        ]);

        $response->assertStatus(201);
        $url = $response->json('url');

        $this->assertIsString($url);
        $this->assertStringNotContainsString('..', $url);
        $this->assertStringNotContainsString(storage_path(), $url);
    }
}
