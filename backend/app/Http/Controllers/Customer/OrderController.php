<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Concerns\BoundsPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    use BoundsPagination;

    public function index(Request $request)
    {
        $query = Order::query()
            ->where('user_id', $request->user()->id)
            ->with(['items.business']);

        if ($request->has('status')) {
            $query->where('status', $request->string('status')->value());
        }

        $orders = $query->orderByDesc('id')->paginate($this->perPage($request));

        return OrderResource::collection($orders);
    }

    public function show(Request $request, int $order)
    {
        $order = Order::where('user_id', $request->user()->id)
            ->where('id', $order)
            ->with(['items.business'])
            ->first();

        if (! $order) {
            abort(404);
        }

        return new OrderResource($order);
    }

    public function store(StoreOrderRequest $request)
    {
        $order = OrderService::createForCustomer(
            $request->user(),
            $request->validated()['items'],
            $request->validated()['customer_note'] ?? null,
        );

        $order->load('items.business');

        return (new OrderResource($order))->response()->setStatusCode(201);
    }
}
