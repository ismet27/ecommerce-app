<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Generates one simple locally-drawn placeholder image per demo product
 * (a solid color block with the product name), so the catalog always has
 * something visual to show without depending on external hotlinks or any
 * copyrighted commercial product photos.
 */
class ProductImageSeeder extends Seeder
{
    private const COLORS = [
        [66, 135, 245], [52, 168, 83], [251, 188, 5], [234, 67, 53],
        [156, 39, 176], [0, 172, 193], [255, 112, 67], [63, 81, 181],
        [0, 150, 136], [121, 85, 72], [96, 125, 139], [233, 30, 99],
    ];

    public function run(): void
    {
        Product::with('images')->orderBy('id')->get()->each(function (Product $product, int $index) {
            if ($product->images->isNotEmpty()) {
                return; // Idempotent: skip products that already have an image.
            }

            $path = $this->generatePlaceholder($product, $index);

            ProductImage::create([
                'product_id' => $product->id,
                'path' => $path,
                'alt_text' => $product->name,
                'sort_order' => 0,
                'is_primary' => true,
            ]);
        });
    }

    private function generatePlaceholder(Product $product, int $index): string
    {
        $width = 800;
        $height = 600;

        $image = imagecreatetruecolor($width, $height);

        [$r, $g, $b] = self::COLORS[$index % count(self::COLORS)];
        $background = imagecolorallocate($image, $r, $g, $b);
        imagefilledrectangle($image, 0, 0, $width, $height, $background);

        $white = imagecolorallocate($image, 255, 255, 255);

        // GD's built-in bitmap font only supports Latin-1, so transliterate
        // the (possibly Turkish) product name for this purely visual label.
        $label = strtoupper(Str::ascii($product->name));
        $lines = explode("\n", wordwrap($label, 22, "\n", true));

        $font = 5;
        $lineHeight = imagefontheight($font) + 6;
        $startY = (int) (($height - count($lines) * $lineHeight) / 2);

        foreach ($lines as $i => $line) {
            $textWidth = imagefontwidth($font) * strlen($line);
            $x = (int) (($width - $textWidth) / 2);
            $y = $startY + $i * $lineHeight;
            imagestring($image, $font, $x, $y, $line, $white);
        }

        ob_start();
        imagepng($image);
        $contents = ob_get_clean();
        imagedestroy($image);

        $path = "products/demo/{$product->slug}.png";
        Storage::disk('public')->put($path, $contents);

        return $path;
    }
}
