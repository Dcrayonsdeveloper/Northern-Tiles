<?php

use App\Domain\Auth\Http\Controllers\Admin\RoleController;
use App\Domain\CMS\Http\Controllers\Admin\AuthorController;
use App\Domain\CMS\Http\Controllers\Admin\PageController;
use App\Domain\CMS\Http\Controllers\Admin\PostController;
use App\Domain\Dictionary\Http\Controllers\Admin\DictionaryController;
use App\Domain\Dashboard\Http\Controllers\Admin\AnnouncementController;
use App\Domain\Menu\Http\Controllers\Admin\MenuController;
use App\Domain\SEO\Http\Controllers\Admin\SeoController;
use App\Domain\Settings\Http\Controllers\Admin\ConfigurationController;
use Illuminate\Support\Facades\Route;

// Dictionary
Route::get('dictionary', [DictionaryController::class, 'index'])->name('dictionary.index');
Route::get('dictionary/create', [DictionaryController::class, 'create'])->name('dictionary.create');
Route::post('dictionary', [DictionaryController::class, 'store'])->name('dictionary.store');
Route::get('dictionary/{dictionaryEntry}/edit', [DictionaryController::class, 'edit'])->name('dictionary.edit');
Route::put('dictionary/{dictionaryEntry}', [DictionaryController::class, 'update'])->name('dictionary.update');
Route::delete('dictionary/{dictionaryEntry}', [DictionaryController::class, 'destroy'])->name('dictionary.destroy');
Route::get('dictionary/export', [DictionaryController::class, 'export'])->name('dictionary.export');
Route::post('dictionary/import', [DictionaryController::class, 'import'])->name('dictionary.import');

// Announcements
Route::resource('announcements', AnnouncementController::class)->except(['show']);

// Configuration
Route::get('configuration', [ConfigurationController::class, 'edit'])->name('configuration.edit');
Route::post('configuration', [ConfigurationController::class, 'update'])->name('configuration.update');

// Roles & Permissions
Route::resource('roles', RoleController::class)->except(['show']);

// Menus
Route::resource('menus', MenuController::class)->except(['show']);
Route::post('menus/{menu}/items', [MenuController::class, 'storeItem'])->name('menus.items.store');
Route::put('menus/{menu}/items/{item}', [MenuController::class, 'updateItem'])->name('menus.items.update');
Route::delete('menus/{menu}/items/{item}', [MenuController::class, 'destroyItem'])->name('menus.items.destroy');
Route::post('menus/{menu}/reorder', [MenuController::class, 'reorderItems'])->name('menus.reorder');

// CMS - Authors
Route::resource('authors', AuthorController::class)->except(['show']);

// CMS - Pages
Route::resource('pages', PageController::class)->except(['show']);
Route::post('pages/{page}/publish', [PageController::class, 'publish'])->name('pages.publish');
Route::post('pages/{page}/unpublish', [PageController::class, 'unpublish'])->name('pages.unpublish');

// CMS - Posts
Route::resource('posts', PostController::class)->except(['show']);
Route::post('posts/{post}/publish', [PostController::class, 'publish'])->name('posts.publish');
Route::post('posts/{post}/unpublish', [PostController::class, 'unpublish'])->name('posts.unpublish');

// SEO
Route::prefix('seo')->name('seo.')->group(function () {
    Route::get('/', [SeoController::class, 'index'])->name('index');
    Route::get('redirects', [SeoController::class, 'redirects'])->name('redirects');
    Route::post('redirects', [SeoController::class, 'storeRedirect'])->name('redirects.store');
    Route::put('redirects/{redirect}', [SeoController::class, 'updateRedirect'])->name('redirects.update');
    Route::delete('redirects/{redirect}', [SeoController::class, 'destroyRedirect'])->name('redirects.destroy');
    Route::get('404-logs', [SeoController::class, 'notFoundLogs'])->name('404-logs');
    Route::post('404-logs/{log}/resolve', [SeoController::class, 'resolve404'])->name('404-logs.resolve');
    Route::post('sitemap/generate', [SeoController::class, 'generateSitemap'])->name('sitemap.generate');
    Route::get('robots', [SeoController::class, 'robots'])->name('robots');
    Route::put('robots', [SeoController::class, 'updateRobots'])->name('robots.update');
    Route::post('meta', [SeoController::class, 'updateMeta'])->name('meta.update');
});
