<?php

namespace App\Http\Requests\Admin;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->route('user');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            'role' => ['sometimes', Rule::in(User::ROLES)],
            'business_id' => [
                'nullable',
                'integer',
                function ($attribute, $value, $fail) use ($user) {
                    // Only re-validate the business assignment when this
                    // request actually touches role or business_id; leave
                    // unrelated partial updates (e.g. just renaming) alone.
                    if (! $this->has('role') && ! $this->has('business_id')) {
                        return;
                    }

                    $effectiveRole = $this->input('role', $user->role);
                    $effectiveBusinessId = $this->has('business_id') ? $value : $user->business_id;

                    if ($effectiveRole !== User::ROLE_SELLER) {
                        return;
                    }

                    if ($effectiveBusinessId === null) {
                        $fail('A business is required for the seller role.');

                        return;
                    }

                    $business = Business::find($effectiveBusinessId);

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
