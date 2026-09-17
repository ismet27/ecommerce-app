<?php

namespace App\Http\Requests\Admin;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', Rule::in(User::ROLES)],
            'business_id' => [
                Rule::requiredIf(fn () => $this->input('role') === User::ROLE_SELLER),
                'nullable',
                'integer',
                function ($attribute, $value, $fail) {
                    if ($this->input('role') !== User::ROLE_SELLER || $value === null) {
                        return;
                    }

                    $business = Business::find($value);

                    if (! $business) {
                        $fail('The selected business does not exist.');
                    } elseif (! $business->is_active) {
                        $fail('The selected business is inactive.');
                    }
                },
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
