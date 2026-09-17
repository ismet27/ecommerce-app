<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public/customer-facing product view. Deliberately omits business_id,
 * category_id, and any seller-management fields.
 */
class CatalogProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => $this->price,
            'stock' => $this->stock,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'business' => $this->whenLoaded('business', fn () => [
                'id' => $this->business->id,
                'name' => $this->business->name,
            ]),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'primary_image' => $this->whenLoaded('images', function () {
                $primary = $this->images->firstWhere('is_primary', true) ?? $this->images->first();

                return $primary ? new ProductImageResource($primary) : null;
            }),
            'created_at' => $this->created_at,
        ];
    }
}
