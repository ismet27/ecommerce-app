<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // Only accept roles we actually know about; unsupported/misspelled
        // role strings must never accidentally grant access.
        $allowedRoles = array_values(array_intersect($roles, User::ROLES));

        if (count($allowedRoles) !== count($roles)) {
            abort(403, 'This route is misconfigured.');
        }

        $user = $request->user();

        if (! $user || ! in_array($user->role, $allowedRoles, true)) {
            abort(403, 'You do not have permission to perform this action.');
        }

        return $next($request);
    }
}
