<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\BoundsPagination;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    use BoundsPagination;

    public function index(Request $request)
    {
        $query = Order::query()->with(['user', 'items.business']);

        if ($search = $request->string('search')->trim()->value()) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->string('status')->value());
        }

        if ($request->has('business_id')) {
            $businessId = $request->integer('business_id');
            $query->whereHas('items', fn ($q) => $q->where('business_id', $businessId));
        }

        if ($request->has('min_total')) {
            $query->where('total_amount', '>=', $request->input('min_total'));
        }

        if ($request->has('max_total')) {
            $query->where('total_amount', '<=', $request->input('max_total'));
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date('date_from'));
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date('date_to'));
        }

        $orders = $query->orderByDesc('id')->paginate($this->perPage($request));

        return OrderResource::collection($orders);
    }

    public function show(Order $order)
    {
        $order->load(['user', 'items.business']);

        return new OrderResource($order);
    }
}
