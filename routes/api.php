<?php

use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\InstagramController;
use App\Http\Controllers\Api\PersonalizationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Note: Cart routes moved to web.php for proper session handling
// The routes are at /api/cart/* but defined in web.php to share the session

// Instagram feed (public, cached)
Route::get('/instagram/posts', [InstagramController::class, 'posts']);
Route::get('/instagram/thumbnails', [InstagramController::class, 'thumbnails']);

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
