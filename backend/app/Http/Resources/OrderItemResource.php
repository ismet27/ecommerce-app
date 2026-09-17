<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name_snapshot' => $this->product_name_snapshot,
            'unit_price_snapshot' => $this->unit_price_snapshot,
            'quantity' => $this->quantity,
            'line_total' => $this->line_total,
            'status' => $this->status,
            'business' => $this->whenLoaded('business', fn () => [
                'id' => $this->business->id,
                'name' => $this->business->name,
            ]),
        ];
    }
}
