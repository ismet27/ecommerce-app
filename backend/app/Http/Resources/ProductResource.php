<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Management view of a product, used by seller and admin endpoints.
 * Exposes ownership fields (business_id/category_id) that the public
 * catalog resource deliberately omits.
 */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => $this->price,
            'stock' => $this->stock,
            'is_active' => $this->is_active,
            'category' => $this->whenLoaded('category', fn () => new CategoryResource($this->category)),
            'business' => $this->whenLoaded('business', fn () => new BusinessResource($this->business)),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'primary_image' => $this->whenLoaded('images', function () {
                $primary = $this->images->firstWhere('is_primary', true) ?? $this->images->first();

                return $primary ? new ProductImageResource($primary) : null;
            }),
            'deleted_at' => $this->deleted_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
