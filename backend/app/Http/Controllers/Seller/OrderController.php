<?php

namespace App\Http\Controllers\Seller;

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
        $businessId = $request->user()->business_id;

        $query = Order::query()
            ->whereHas('items', fn ($q) => $q->where('business_id', $businessId))
            ->with('user');

        if ($request->has('status')) {
            $query->where('status', $request->string('status')->value());
        }

        $orders = $query->orderByDesc('id')->paginate($this->perPage($request));

        $orders->getCollection()->transform(fn (Order $order) => $this->withOwnItems($order, $businessId));

        return OrderResource::collection($orders);
    }

    public function show(Request $request, int $order)
    {
        $businessId = $request->user()->business_id;

        $order = Order::whereHas('items', fn ($q) => $q->where('business_id', $businessId))
            ->where('id', $order)
            ->with('user')
            ->first();

        if (! $order) {
            abort(404);
        }

        return new OrderResource($this->withOwnItems($order, $businessId));
    }

    /**
     * Overrides the "items" relation on the order with only the items
     * belonging to the seller's own business, so the shared OrderResource
     * never leaks another business's order-item details.
     */
    private function withOwnItems(Order $order, int $businessId): Order
    {
        $order->setRelation(
            'items',
            $order->items()->where('business_id', $businessId)->with('business')->get()
        );

        return $order;
    }
}
