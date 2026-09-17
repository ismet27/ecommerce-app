<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\BoundsPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBusinessRequest;
use App\Http\Requests\Admin\UpdateBusinessRequest;
use App\Http\Resources\BusinessResource;
use App\Models\Business;
use Illuminate\Http\Request;

class BusinessController extends Controller
{
    use BoundsPagination;

    public function index(Request $request)
    {
        $query = Business::query();

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $businesses = $query->orderBy('name')->paginate($this->perPage($request));

        return BusinessResource::collection($businesses);
    }

    public function store(StoreBusinessRequest $request)
    {
        $data = $request->validated();
        $data['is_active'] = $data['is_active'] ?? true;

        $business = Business::create($data);

        return (new BusinessResource($business))->response()->setStatusCode(201);
    }

    public function show(Business $business)
    {
        return new BusinessResource($business);
    }

    public function update(UpdateBusinessRequest $request, Business $business)
    {
        $business->update($request->validated());

        return new BusinessResource($business);
    }
}
