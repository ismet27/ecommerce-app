<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Concerns\ResolvesSellerProduct;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreProductImageRequest;
use App\Http\Requests\Seller\UpdateProductImageRequest;
use App\Http\Resources\ProductImageResource;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class ProductImageController extends Controller
{
    use ResolvesSellerProduct;

    public function store(StoreProductImageRequest $request, int $product)
    {
        $product = $this->ownedProduct($request, $product);

        $image = DB::transaction(function () use ($request, $product) {
            $path = $request->file('image')->store(
                "products/{$product->business_id}/{$product->id}",
                'public'
            );

            $isFirst = $product->images()->count() === 0;
            $nextSortOrder = (int) ($product->images()->max('sort_order') ?? -1) + 1;

            return ProductImage::create([
                'product_id' => $product->id,
                'path' => $path,
                'alt_text' => $request->input('alt_text'),
                'sort_order' => $nextSortOrder,
                'is_primary' => $isFirst,
            ]);
        });

        return (new ProductImageResource($image))->response()->setStatusCode(201);
    }

    public function update(UpdateProductImageRequest $request, int $product, int $image)
    {
        $product = $this->ownedProduct($request, $product);
        $image = $this->ownedImage($product, $image);

        $data = $request->validated();

        $image = DB::transaction(function () use ($product, $image, $data) {
            if (array_key_exists('is_primary', $data) && $data['is_primary']) {
                ProductImage::where('product_id', $product->id)
                    ->where('id', '!=', $image->id)
                    ->update(['is_primary' => false]);
            }

            $image->update($data);

            return $image->fresh();
        });

        return new ProductImageResource($image);
    }

    public function destroy(Request $request, int $product, int $image)
    {
        $product = $this->ownedProduct($request, $product);
        $image = $this->ownedImage($product, $image);

        $path = $image->path;
        $wasPrimary = $image->is_primary;

        DB::transaction(function () use ($product, $image, $wasPrimary) {
            $image->delete();

            if ($wasPrimary) {
                $next = ProductImage::where('product_id', $product->id)
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->first();

                $next?->update(['is_primary' => true]);
            }
        });

        Storage::disk('public')->delete($path);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    private function ownedImage(Product $product, int $imageId): ProductImage
    {
        $image = ProductImage::where('product_id', $product->id)
            ->where('id', $imageId)
            ->first();

        if (! $image) {
            abort(404);
        }

        return $image;
    }
}
