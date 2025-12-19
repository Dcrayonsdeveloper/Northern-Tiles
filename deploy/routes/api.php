<?php

use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\PersonalizationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Cart Routes (guest & authenticated)
Route::prefix('cart')->name('api.cart.')->group(function () {
    Route::get('count', [CartController::class, 'count'])->name('count');
    Route::get('/', [CartController::class, 'index'])->name('index');
    Route::post('add', [CartController::class, 'add'])->name('add');
    Route::put('{item}', [CartController::class, 'update'])->name('update');
    Route::delete('{item}', [CartController::class, 'remove'])->name('remove');
    Route::delete('/', [CartController::class, 'clear'])->name('clear');
});

// Favorites Routes (requires auth)
Route::middleware('auth:sanctum')->prefix('favorites')->name('api.favorites.')->group(function () {
    Route::post('toggle', [FavoriteController::class, 'toggle'])->name('toggle');
    Route::get('count', [FavoriteController::class, 'count'])->name('count');
    Route::get('/', [FavoriteController::class, 'index'])->name('index');
    Route::get('check', [FavoriteController::class, 'check'])->name('check');
});

// Personalization Routes (guest & authenticated)
Route::prefix('personalization')->name('api.personalization.')->group(function () {
    Route::post('track/view', [PersonalizationController::class, 'trackView'])->name('track.view');
    Route::get('recently-viewed', [PersonalizationController::class, 'recentlyViewed'])->name('recently-viewed');
    Route::get('recommendations/{productId}', [PersonalizationController::class, 'recommendations'])->name('recommendations');
    Route::get('personalized', [PersonalizationController::class, 'personalized'])->name('personalized');
});
