<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            if (app()->environment('testing')) {
                Route::prefix('api')->middleware('api')->group(base_path('routes/testing.php'));
            }
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // This is an API-only backend with no web login page, so an
        // unauthenticated request should always get a 401 JSON response
        // rather than a redirect to a (non-existent) "login" route.
        $middleware->redirectGuestsTo(fn () => null);

        $middleware->alias([
            'active' => \App\Http\Middleware\EnsureUserIsActive::class,
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
            'business.active' => \App\Http\Middleware\EnsureSellerBusinessIsActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
