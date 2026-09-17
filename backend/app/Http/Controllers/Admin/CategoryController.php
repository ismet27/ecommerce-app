<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\BoundsPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    use BoundsPagination;

    public function index(Request $request)
    {
        $query = Category::query();

        if ($search = $request->string('search')->trim()->value()) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $categories = $query->orderBy('name')->paginate($this->perPage($request));

        return CategoryResource::collection($categories);
    }

    public function store(StoreCategoryRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
        $data['is_active'] = $data['is_active'] ?? true;

        $category = Category::create($data);

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function show(Category $category)
    {
        return new CategoryResource($category);
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $data = $request->validated();

        if (array_key_exists('slug', $data) && $data['slug'] === null) {
            $data['slug'] = Str::slug($data['name'] ?? $category->name);
        }

        $category->update($data);

        return new CategoryResource($category);
    }
}
