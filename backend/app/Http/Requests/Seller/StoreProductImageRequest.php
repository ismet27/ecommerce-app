<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class StoreProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'image' => [
                'required',
                File::types(['jpg', 'jpeg', 'png', 'webp'])->max(5 * 1024),
            ],
            'alt_text' => ['nullable', 'string', 'max:255'],
        ];
    }
}
