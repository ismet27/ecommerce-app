<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\BoundsPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    use BoundsPagination;

    public function index(Request $request)
    {
        $query = User::query();

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role')) {
            $query->where('role', $request->string('role')->value());
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('business_id')) {
            $query->where('business_id', $request->integer('business_id'));
        }

        $users = $query->orderBy('name')->paginate($this->perPage($request));

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();

        if ($data['role'] !== User::ROLE_SELLER) {
            $data['business_id'] = null;
        }
        $data['is_active'] = $data['is_active'] ?? true;

        $user = User::create($data);

        return (new UserResource($user))->response()->setStatusCode(201);
    }

    public function show(User $user)
    {
        return new UserResource($user);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $admin = $request->user();
        $data = $request->validated();

        $effectiveRole = $data['role'] ?? $user->role;
        $effectiveActive = array_key_exists('is_active', $data) ? $data['is_active'] : $user->is_active;

        if ($user->id === $admin->id) {
            if (array_key_exists('is_active', $data) && $data['is_active'] === false) {
                throw ValidationException::withMessages([
                    'is_active' => ['You cannot deactivate your own account.'],
                ]);
            }

            if ($user->role === User::ROLE_ADMIN && $effectiveRole !== User::ROLE_ADMIN) {
                throw ValidationException::withMessages([
                    'role' => ['You cannot change your own admin role.'],
                ]);
            }
        }

        $wasActiveAdmin = $user->role === User::ROLE_ADMIN && $user->is_active;
        $willBeActiveAdmin = $effectiveRole === User::ROLE_ADMIN && $effectiveActive;

        if ($wasActiveAdmin && ! $willBeActiveAdmin) {
            $remainingActiveAdmins = User::where('role', User::ROLE_ADMIN)
                ->where('is_active', true)
                ->where('id', '!=', $user->id)
                ->count();

            if ($remainingActiveAdmins < 1) {
                throw ValidationException::withMessages([
                    'role' => ['At least one active admin is required.'],
                ]);
            }
        }

        if ($effectiveRole !== User::ROLE_SELLER) {
            $data['business_id'] = null;
        }

        if (array_key_exists('password', $data) && $data['password'] === null) {
            unset($data['password']);
        }
        $passwordChanged = array_key_exists('password', $data);

        $becomingInactive = array_key_exists('is_active', $data)
            && $data['is_active'] === false
            && $user->is_active === true;

        $user->update($data);

        if ($passwordChanged || $becomingInactive) {
            $user->tokens()->delete();
        }

        return new UserResource($user);
    }
}
