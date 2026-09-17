<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shared order representation for customer/seller/admin endpoints.
 * The set of items included is decided by the controller (e.g. a seller
 * only ever loads their own business's items onto the model before
 * wrapping it here), not by this resource.
 */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'total_amount' => $this->total_amount,
            'customer_note' => $this->customer_note,
            'customer' => $this->whenLoaded('user', fn () => [
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
        ];
    }
}
