<?php

use Illuminate\Support\Facades\Route;

// These routes exist only to exercise the "active" and "role" middleware in
// automated tests. They are registered exclusively in the testing
// environment (see bootstrap/app.php) and never reach production routing.

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('/test/active-only', fn () => response()->json(['ok' => true]));

    Route::middleware('role:admin')->get('/test/admin-only', fn () => response()->json(['ok' => true]));
    Route::middleware('role:seller')->get('/test/seller-only', fn () => response()->json(['ok' => true]));
    Route::middleware('role:customer')->get('/test/customer-only', fn () => response()->json(['ok' => true]));
    Route::middleware('role:seller,admin')->get('/test/seller-or-admin', fn () => response()->json(['ok' => true]));
    Route::middleware('role:not-a-real-role')->get('/test/unsupported-role', fn () => response()->json(['ok' => true]));
});

Route::middleware(['auth:sanctum'])->get('/test/no-active-check', fn () => response()->json(['ok' => true]));
