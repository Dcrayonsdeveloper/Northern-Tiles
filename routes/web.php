<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\ContactMessageController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\SiteSettingsController;
use App\Http\Controllers\Admin\UiSettingsController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Storefront\CartController;
use App\Http\Controllers\Storefront\CheckoutController;
use App\Http\Controllers\Storefront\ContactController;
use App\Http\Controllers\Storefront\HomeController;
use App\Http\Controllers\Storefront\PageController;
use App\Http\Controllers\Storefront\ShopController;
use App\Http\Controllers\Public\BlogController;
use App\Http\Controllers\Public\PageController as PublicPageController;
use App\Http\Controllers\Public\ShopController as PublicShopController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\SellerMiddleware;
use App\Domain\Dashboard\Http\Controllers\Admin\AdminDashboardController as WidgetAdminDashboardController;
use App\Domain\Dashboard\Http\Controllers\Admin\DashboardLayoutController;
use App\Domain\Dashboard\Http\Controllers\Seller\SellerDashboardController;
use App\Domain\Dashboard\Http\Controllers\Seller\DashboardLayoutController as SellerDashboardLayoutController;
use App\Domain\SEO\Services\SeoService;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', HomeController::class)->name('home');

Route::get('/shop', [ShopController::class, 'index'])->name('shop.index');
Route::get('/products/{product}', [ShopController::class, 'show'])->name('products.show');

Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
Route::put('/cart/{product}', [CartController::class, 'update'])->name('cart.update');
Route::delete('/cart/{product}', [CartController::class, 'destroy'])->name('cart.destroy');

Route::get('/checkout', [CheckoutController::class, 'create'])->name('checkout.index');
Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');

Route::get('/about', [PageController::class, 'about'])->name('pages.about');
Route::get('/contact', [PageController::class, 'contact'])->name('pages.contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

// Blog Routes
Route::prefix('blog')->name('blog.')->group(function () {
    Route::get('/', [BlogController::class, 'index'])->name('index');
    Route::get('/category/{slug}', [BlogController::class, 'category'])->name('category');
    Route::get('/author/{slug}', [BlogController::class, 'author'])->name('author');
    Route::get('/{slug}', [BlogController::class, 'show'])->name('show');
});

// CMS Pages - supports hierarchical slugs like /page/about/team
Route::get('/page/{slug}', [PublicPageController::class, 'show'])
    ->where('slug', '[a-zA-Z0-9-_/]+')
    ->name('page.show');

// SEO Routes
Route::get('/sitemap.xml', function (SeoService $seoService) {
    return response($seoService->generateSitemap(), 200)
        ->header('Content-Type', 'application/xml');
})->name('sitemap');

Route::get('/robots.txt', function (SeoService $seoService) {
    return response($seoService->getRobotsTxt(), 200)
        ->header('Content-Type', 'text/plain');
})->name('robots');

Route::get('/welcome', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('welcome');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified', AdminMiddleware::class])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::redirect('/', '/admin/dashboard');
        Route::get('/dashboard', WidgetAdminDashboardController::class)->name('dashboard');
        Route::get('/dashboard/layout', [DashboardLayoutController::class, 'edit'])->name('dashboard.layout.edit');
        Route::put('/dashboard/layout', [DashboardLayoutController::class, 'update'])->name('dashboard.layout.update');
        Route::resource('orders', OrderController::class)->only(['index', 'show', 'update']);
        Route::resource('categories', CategoryController::class)->except(['show']);
        Route::resource('products', ProductController::class)->except(['show']);
        Route::resource('users', UserController::class)->only(['index', 'edit', 'update']);
        Route::resource('messages', ContactMessageController::class)->only(['index', 'show', 'update', 'destroy']);
        Route::get('/settings/ui', [UiSettingsController::class, 'edit'])->name('settings.ui.edit');
        Route::put('/settings/ui', [UiSettingsController::class, 'update'])->name('settings.ui.update');
        Route::get('/settings/site', [SiteSettingsController::class, 'edit'])->name('settings.site.edit');
        Route::put('/settings/site', [SiteSettingsController::class, 'update'])->name('settings.site.update');

        require __DIR__.'/admin.php';
    });

Route::middleware(['auth', 'verified', SellerMiddleware::class])
    ->prefix('seller')
    ->name('seller.')
    ->group(function () {
        Route::redirect('/', '/seller/dashboard');
        Route::get('/dashboard', SellerDashboardController::class)->name('dashboard');
        Route::get('/dashboard/layout', [SellerDashboardLayoutController::class, 'edit'])->name('dashboard.layout.edit');
        Route::put('/dashboard/layout', [SellerDashboardLayoutController::class, 'update'])->name('dashboard.layout.update');
    });

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
