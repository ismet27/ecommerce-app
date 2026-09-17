<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Product;
use Illuminate\Http\Request;

trait ResolvesSellerProduct
{
    /**
     * Find a product owned by the authenticated seller's business, or
     * abort with 404 (never leaking whether the product exists under a
     * different business).
     */
    protected function ownedProduct(Request $request, int $productId): Product
    {
        $product = Product::where('business_id', $request->user()->business_id)
            ->where('id', $productId)
            ->first();

        if (! $product) {
            abort(404);
        }

        return $product;
    }
}
