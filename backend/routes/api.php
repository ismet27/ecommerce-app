<?php

use App\Http\Controllers\Admin\BusinessController as AdminBusinessController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Catalog\CategoryController as CatalogCategoryController;
use App\Http\Controllers\Catalog\ProductController as CatalogProductController;
use App\Http\Controllers\Customer\OrderController as CustomerOrderController;
use App\Http\Controllers\Seller\OrderController as SellerOrderController;
use App\Http\Controllers\Seller\OrderItemController as SellerOrderItemController;
use App\Http\Controllers\Seller\ProductController as SellerProductController;
use App\Http\Controllers\Seller\ProductImageController as SellerProductImageController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

// Public / customer catalog browsing (no authentication required).
Route::prefix('catalog')->group(function () {
    Route::get('/products', [CatalogProductController::class, 'index']);
    Route::get('/products/{product}', [CatalogProductController::class, 'show']);
    Route::get('/categories', [CatalogCategoryController::class, 'index']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // ADMIN
    Route::middleware(['active', 'role:admin'])->prefix('admin')->group(function () {
        Route::apiResource('businesses', AdminBusinessController::class)->except(['destroy']);
        Route::apiResource('categories', AdminCategoryController::class)->except(['destroy']);
        Route::apiResource('users', AdminUserController::class)->except(['destroy']);

        Route::get('/products', [AdminProductController::class, 'index']);
        Route::get('/products/{product}', [AdminProductController::class, 'show']);

        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
    });

    // SELLER
    Route::middleware(['active', 'role:seller', 'business.active'])->prefix('seller')->group(function () {
        Route::apiResource('products', SellerProductController::class);

        Route::post('/products/{product}/images', [SellerProductImageController::class, 'store']);
        Route::patch('/products/{product}/images/{image}', [SellerProductImageController::class, 'update']);
        Route::delete('/products/{product}/images/{image}', [SellerProductImageController::class, 'destroy']);

        Route::get('/orders', [SellerOrderController::class, 'index']);
        Route::get('/orders/{order}', [SellerOrderController::class, 'show']);

        Route::patch('/order-items/{orderItem}/status', [SellerOrderItemController::class, 'updateStatus']);
    });

    // CUSTOMER
    Route::middleware(['active', 'role:customer'])->group(function () {
        Route::post('/orders', [CustomerOrderController::class, 'store']);
        Route::get('/orders', [CustomerOrderController::class, 'index']);
        Route::get('/orders/{order}', [CustomerOrderController::class, 'show']);
    });
});
