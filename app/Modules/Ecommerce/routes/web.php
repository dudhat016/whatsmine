<?php

use App\Modules\Ecommerce\Http\Controllers\EcommerceOAuthController;
use App\Modules\Ecommerce\Http\Controllers\OrderContextController;
use App\Modules\Ecommerce\Http\Controllers\OrderController;
use App\Modules\Ecommerce\Http\Controllers\ProductController;
use App\Modules\Ecommerce\Http\Controllers\StoreController;
use Illuminate\Support\Facades\Route;

// Ecommerce module — client app routes (per-workspace store management).
Route::middleware(['web', 'client-app'])->prefix('app/ecommerce')->name('client.ecommerce.')->group(function () {
    Route::get('/stores', [StoreController::class, 'index'])->name('stores.index');
    Route::post('/stores', [StoreController::class, 'store'])->name('stores.store');
    Route::post('/stores/{store}/test', [StoreController::class, 'test'])->name('stores.test');
    Route::post('/stores/{store}/sync', [StoreController::class, 'sync'])->name('stores.sync');
    Route::delete('/stores/{store}', [StoreController::class, 'destroy'])->name('stores.destroy');

    // OAuth onboarding (browser-driven; tokens are obtained automatically).
    Route::get('/oauth/{platform}/connect', [EcommerceOAuthController::class, 'connect'])->name('oauth.connect');
    Route::get('/oauth/shopify/callback', [EcommerceOAuthController::class, 'shopifyCallback'])->name('oauth.shopify.callback');
    Route::get('/oauth/bigcommerce/callback', [EcommerceOAuthController::class, 'bigcommerceCallback'])->name('oauth.bigcommerce.callback');
    Route::get('/oauth/woocommerce/return', [EcommerceOAuthController::class, 'woocommerceReturn'])->name('oauth.woocommerce.return');

    // Products + inventory
    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::get('/products/create', [ProductController::class, 'create'])->name('products.create');
    Route::get('/products/search', [ProductController::class, 'search'])->name('products.search');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::get('/products/{product}/edit', [ProductController::class, 'edit'])->name('products.edit');
    Route::put('/products/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
    Route::post('/products/{product}/duplicate', [ProductController::class, 'duplicate'])->name('products.duplicate');


    // Orders dashboard + management
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('/orders/{order}/refresh', [OrderController::class, 'refresh'])->name('orders.refresh');
    Route::post('/orders/{order}/fulfill', [OrderController::class, 'fulfill'])->name('orders.fulfill');

    // Inbox order context (Phase 2).
    Route::get('/contacts/{contact}/orders', [OrderContextController::class, 'index'])->name('contacts.orders');
});
