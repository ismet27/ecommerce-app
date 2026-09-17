<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderItemResource;
use App\Models\OrderItem;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderItemController extends Controller
{
    public function updateStatus(Request $request, int $orderItem)
    {
        $request->validate([
            'status' => ['required', 'string'],
        ]);

        $item = OrderItem::where('id', $orderItem)
            ->where('business_id', $request->user()->business_id)
            ->first();

        if (! $item) {
            abort(404);
        }

        $updated = OrderService::transitionItemStatus($item, $request->string('status')->value());

        return new OrderItemResource($updated->load('business'));
    }
}
