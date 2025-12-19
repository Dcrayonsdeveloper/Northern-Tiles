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
use App\Http\Controllers\Admin\ProductController;
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
Route::post('menus/{menu}/items/sync', [MenuController::class, 'syncItems'])->name('menus.items.sync');
Route::put('menus/{menu}/items/{item}', [MenuController::class, 'updateItem'])->name('menus.items.update');
Route::delete('menus/{menu}/items/{item}', [MenuController::class, 'destroyItem'])->name('menus.items.destroy');
Route::post('menus/{menu}/reorder', [MenuController::class, 'reorderItems'])->name('menus.reorder');

// CMS - Authors
Route::resource('authors', AuthorController::class)->except(['show']);

// CMS - Pages
Route::resource('pages', PageController::class)->except(['show']);
Route::post('pages/{page}/publish', [PageController::class, 'publish'])->name('pages.publish');
Route::post('pages/{page}/unpublish', [PageController::class, 'unpublish'])->name('pages.unpublish');
Route::post('pages/{page}/duplicate', [PageController::class, 'duplicate'])->name('pages.duplicate');
Route::post('pages/{page}/archive', [PageController::class, 'archive'])->name('pages.archive');
Route::post('pages/{page}/restore', [PageController::class, 'restore'])->name('pages.restore')->withTrashed();
Route::delete('pages/{page}/force', [PageController::class, 'forceDelete'])->name('pages.forceDelete')->withTrashed();
Route::get('pages/generate-slug', [PageController::class, 'generateSlug'])->name('pages.generateSlug');
Route::post('pages/bulk-delete', [PageController::class, 'bulkDelete'])->name('pages.bulk-delete');
Route::post('pages/bulk-status', [PageController::class, 'bulkStatus'])->name('pages.bulk-status');

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

// Products (Shopify-style management)
Route::prefix('products')->name('products.')->group(function () {
    Route::get('/', [ProductController::class, 'index'])->name('index');
    Route::get('create', [ProductController::class, 'create'])->name('create');
    Route::post('/', [ProductController::class, 'store'])->name('store');
    Route::get('{product}/edit', [ProductController::class, 'edit'])->name('edit');
    Route::put('{product}', [ProductController::class, 'update'])->name('update');
    Route::delete('{product}', [ProductController::class, 'destroy'])->name('destroy');

    // Additional product actions
    Route::post('{product}/duplicate', [ProductController::class, 'duplicate'])->name('duplicate');
    Route::post('{product}/status', [ProductController::class, 'updateStatus'])->name('status');
    Route::post('{product}/autosave', [ProductController::class, 'autosave'])->name('autosave');

    // Media management
    Route::post('{product}/media', [ProductController::class, 'uploadMedia'])->name('media.upload');
    Route::delete('{product}/media/{media}', [ProductController::class, 'deleteMedia'])->name('media.delete');
    Route::post('{product}/media/reorder', [ProductController::class, 'reorderMedia'])->name('media.reorder');
    Route::post('{product}/media/{media}/primary', [ProductController::class, 'setPrimaryMedia'])->name('media.primary');

    // Variants
    Route::post('{product}/variants/generate', [ProductController::class, 'generateVariants'])->name('variants.generate');

    // Tags
    Route::get('tags/search', [ProductController::class, 'searchTags'])->name('tags.search');

    // Bulk import
    Route::post('bulk-import', [ProductController::class, 'bulkImport'])->name('bulk-import');
    Route::get('bulk-import/{job}/status', [ProductController::class, 'bulkImportStatus'])->name('bulk-import.status');
    Route::get('import-template', [ProductController::class, 'downloadTemplate'])->name('import-template');

    // Bulk actions
    Route::post('bulk-delete', [ProductController::class, 'bulkDelete'])->name('bulk-delete');
    Route::post('bulk-status', [ProductController::class, 'bulkStatus'])->name('bulk-status');
});

// Collections (Shopify-style)
Route::prefix('collections')->name('collections.')->group(function () {
    Route::get('/', [\App\Domain\Catalog\Http\Controllers\Admin\CollectionController::class, 'index'])->name('index');
    Route::get('create', [\App\Domain\Catalog\Http\Controllers\Admin\CollectionController::class, 'create'])->name('create');
    Route::post('/', [\App\Domain\Catalog\Http\Controllers\Admin\CollectionController::class, 'store'])->name('store');
    Route::get('{collection}/edit', [\App\Domain\Catalog\Http\Controllers\Admin\CollectionController::class, 'edit'])->name('edit');
    Route::put('{collection}', [\App\Domain\Catalog\Http\Controllers\Admin\CollectionController::class, 'update'])->name('update');
    Route::delete('{collection}', [\App\Domain\Catalog\Http\Controllers\Admin\CollectionController::class, 'destroy'])->name('destroy');
    Route::post('{collection}/reindex', [\App\Domain\Catalog\Http\Controllers\Admin\CollectionController::class, 'reindex'])->name('reindex');
    Route::post('{collection}/reorder', [\App\Domain\Catalog\Http\Controllers\Admin\CollectionController::class, 'reorderProducts'])->name('reorder');
    Route::post('{collection}/add-product', [\App\Domain\Catalog\Http\Controllers\Admin\CollectionController::class, 'addProduct'])->name('add-product');
    Route::post('{collection}/remove-product', [\App\Domain\Catalog\Http\Controllers\Admin\CollectionController::class, 'removeProduct'])->name('remove-product');
    Route::post('preview', [\App\Domain\Catalog\Http\Controllers\Admin\CollectionController::class, 'preview'])->name('preview');
    Route::get('search-products', [\App\Domain\Catalog\Http\Controllers\Admin\CollectionController::class, 'searchProducts'])->name('search-products');
});

// Abandoned Carts
Route::prefix('abandoned-carts')->name('abandoned-carts.')->group(function () {
    Route::get('/', [\App\Domain\Marketing\Http\Controllers\Admin\AbandonedCartController::class, 'index'])->name('index');
    Route::get('{cart}', [\App\Domain\Marketing\Http\Controllers\Admin\AbandonedCartController::class, 'show'])->name('show');
    Route::get('stats/data', [\App\Domain\Marketing\Http\Controllers\Admin\AbandonedCartController::class, 'statistics'])->name('statistics');

    // Flows
    Route::get('flows/list', [\App\Domain\Marketing\Http\Controllers\Admin\AbandonedCartController::class, 'flows'])->name('flows');
    Route::get('flows/create', [\App\Domain\Marketing\Http\Controllers\Admin\AbandonedCartController::class, 'createFlow'])->name('flows.create');
    Route::post('flows', [\App\Domain\Marketing\Http\Controllers\Admin\AbandonedCartController::class, 'storeFlow'])->name('flows.store');
    Route::get('flows/{flow}/edit', [\App\Domain\Marketing\Http\Controllers\Admin\AbandonedCartController::class, 'editFlow'])->name('flows.edit');
    Route::put('flows/{flow}', [\App\Domain\Marketing\Http\Controllers\Admin\AbandonedCartController::class, 'updateFlow'])->name('flows.update');
    Route::delete('flows/{flow}', [\App\Domain\Marketing\Http\Controllers\Admin\AbandonedCartController::class, 'destroyFlow'])->name('flows.destroy');

    // Messages
    Route::get('messages/list', [\App\Domain\Marketing\Http\Controllers\Admin\AbandonedCartController::class, 'messages'])->name('messages');
});

// Email Templates
Route::prefix('email-templates')->name('email-templates.')->group(function () {
    Route::get('/', [\App\Domain\Marketing\Http\Controllers\Admin\EmailTemplateController::class, 'index'])->name('index');
    Route::get('create', [\App\Domain\Marketing\Http\Controllers\Admin\EmailTemplateController::class, 'create'])->name('create');
    Route::post('/', [\App\Domain\Marketing\Http\Controllers\Admin\EmailTemplateController::class, 'store'])->name('store');
    Route::get('{emailTemplate}/edit', [\App\Domain\Marketing\Http\Controllers\Admin\EmailTemplateController::class, 'edit'])->name('edit');
    Route::put('{emailTemplate}', [\App\Domain\Marketing\Http\Controllers\Admin\EmailTemplateController::class, 'update'])->name('update');
    Route::delete('{emailTemplate}', [\App\Domain\Marketing\Http\Controllers\Admin\EmailTemplateController::class, 'destroy'])->name('destroy');
    Route::get('{emailTemplate}/preview', [\App\Domain\Marketing\Http\Controllers\Admin\EmailTemplateController::class, 'preview'])->name('preview');
    Route::post('{emailTemplate}/test', [\App\Domain\Marketing\Http\Controllers\Admin\EmailTemplateController::class, 'sendTest'])->name('test');
    Route::post('{emailTemplate}/duplicate', [\App\Domain\Marketing\Http\Controllers\Admin\EmailTemplateController::class, 'duplicate'])->name('duplicate');
});
