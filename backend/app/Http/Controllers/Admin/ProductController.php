<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\BoundsPagination;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use BoundsPagination;

    public function index(Request $request)
    {
        $query = Product::query()->with(['category', 'business', 'images']);

        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('business_id')) {
            $query->where('business_id', $request->integer('business_id'));
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $products = $query->orderByDesc('id')->paginate($this->perPage($request));

        return ProductResource::collection($products);
    }

    public function show(Request $request, int $product)
    {
        $query = Product::query()->with(['category', 'business', 'images']);

        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        $product = $query->findOrFail($product);

        return new ProductResource($product);
    }
}
