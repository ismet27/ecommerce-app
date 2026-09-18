<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Copies the bundled local product photo for each demo product into the
 * public storage disk and registers it as that product's primary image.
 *
 * The source files live in database/seeders/assets/products and ship with
 * the repository, so seeding stays deterministic and fully offline - no
 * external hotlinks and no runtime image generation.
 */
class ProductImageSeeder extends Seeder
{
    /**
     * Product slug => bundled source file name.
     */
    private const IMAGES = [
        'kablosuz-kulaklik' => 'kablosuz-kulaklik.jpg',
        'mekanik-klavye' => 'mekanik-klavye.jpg',
        'oyuncu-mouse' => 'oyuncu-mouse.jpg',
        'laptop-standi' => 'laptop-standi.jpg',
        'usb-c-hub' => 'usb-c-hub.jpg',
        'telefon-kilifi' => 'telefon-kilifi.jpg',
        'powerbank' => 'powerbank.jpg',
        'web-kamera' => 'web-kamera.jpg',
        'monitor' => 'monitor.jpg',
        'bluetooth-hoparlor' => 'bluetooth-hoparlor.jpg',
        'mekanik-klavye-kol-altligi' => 'mekanik-klavye-kol-altligi.jpg',
        'telefon-ekran-koruyucu' => 'telefon-ekran-koruyucu.jpg',
    ];

    public function run(): void
    {
        Product::with('images')->orderBy('id')->get()->each(function (Product $product) {
            if ($product->images->isNotEmpty()) {
                return; // Idempotent: skip products that already have an image.
            }

            if (! array_key_exists($product->slug, self::IMAGES)) {
                return; // Not one of the bundled demo products.
            }

            $path = $this->storeImage($product);

            ProductImage::create([
                'product_id' => $product->id,
                'path' => $path,
                'alt_text' => $product->name,
                'sort_order' => 0,
                'is_primary' => true,
            ]);
        });
    }

    /**
     * Copy the bundled photo onto the public disk and return its relative path.
     */
    private function storeImage(Product $product): string
    {
        $source = database_path('seeders/assets/products/'.self::IMAGES[$product->slug]);

        if (! is_file($source)) {
            throw new RuntimeException("Missing demo product image: {$source}");
        }

        $path = "products/demo/{$product->slug}.jpg";
        $disk = Storage::disk('public');

        // Re-seeding repeatedly (tests, migrate:fresh --seed) should not copy
        // the same bytes over and over.
        if ($disk->exists($path) && $disk->size($path) === filesize($source)) {
            return $path;
        }

        $stream = fopen($source, 'rb');

        try {
            $disk->put($path, $stream);
        } finally {
            fclose($stream);
        }

        return $path;
    }
}
