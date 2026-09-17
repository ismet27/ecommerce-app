<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Concerns\BoundsPagination;
use App\Http\Controllers\Concerns\ResolvesSellerProduct;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreProductRequest;
use App\Http\Requests\Seller\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ProductController extends Controller
{
    use BoundsPagination, ResolvesSellerProduct;

    public function index(Request $request)
    {
        $query = Product::query()
            ->with(['category', 'business', 'images'])
            ->where('business_id', $request->user()->business_id);

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->string('stock_status')->value() === 'out_of_stock') {
            $query->where('stock', 0);
        } elseif ($request->string('stock_status')->value() === 'in_stock') {
            $query->where('stock', '>', 0);
        }

        $products = $query->orderByDesc('id')->paginate($this->perPage($request));

        return ProductResource::collection($products);
    }

    public function store(StoreProductRequest $request)
    {
        $data = $request->validated();
        $data['business_id'] = $request->user()->business_id;
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
        $data['is_active'] = $data['is_active'] ?? true;

        $product = Product::create($data);
        $product->load(['category', 'business', 'images']);

        return (new ProductResource($product))->response()->setStatusCode(201);
    }

    public function show(Request $request, int $product)
    {
        $product = $this->ownedProduct($request, $product);
        $product->load(['category', 'business', 'images']);

        return new ProductResource($product);
    }

    public function update(UpdateProductRequest $request, int $product)
    {
        $product = $this->ownedProduct($request, $product);

        $data = $request->validated();
        unset($data['business_id']); // server-controlled, never accepted from client

        if (array_key_exists('slug', $data) && $data['slug'] === null) {
            $data['slug'] = Str::slug($data['name'] ?? $product->name);
        }

        $product->update($data);
        $product->load(['category', 'business', 'images']);

        return new ProductResource($product);
    }

    public function destroy(Request $request, int $product)
    {
        $product = $this->ownedProduct($request, $product);
        $product->delete(); // soft delete only

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
