<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Concerns\BoundsPagination;
use App\Http\Controllers\Controller;
use App\Http\Resources\CatalogProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use BoundsPagination;

    private function eligibleQuery()
    {
        return Product::query()
            ->with(['category', 'business', 'images'])
            ->where('is_active', true)
            ->whereHas('category', fn ($q) => $q->where('is_active', true))
            ->whereHas('business', fn ($q) => $q->where('is_active', true));
    }

    public function index(Request $request)
    {
        $query = $this->eligibleQuery();

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->input('min_price'));
        }

        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->input('max_price'));
        }

        if ($request->boolean('in_stock')) {
            $query->where('stock', '>', 0);
        }

        $products = $query->orderByDesc('id')->paginate($this->perPage($request));

        return CatalogProductResource::collection($products);
    }

    public function show(int $product)
    {
        $product = $this->eligibleQuery()->where('id', $product)->first();

        if (! $product) {
            abort(404);
        }

        return new CatalogProductResource($product);
    }
}
