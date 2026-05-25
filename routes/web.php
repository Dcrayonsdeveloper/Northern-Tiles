<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\ContactMessageController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\SiteSettingsController;
use App\Http\Controllers\Admin\UiSettingsController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Storefront\CartController;
use App\Http\Controllers\Storefront\CheckoutController;
use App\Http\Controllers\Storefront\CollectionController;
use App\Http\Controllers\Storefront\ContactController;
use App\Http\Controllers\Storefront\HomeController;
use App\Http\Controllers\Storefront\PageController;
use App\Http\Controllers\Storefront\ShopController;
use App\Http\Controllers\Public\BlogController;
use App\Http\Controllers\Public\PageController as PublicPageController;
use App\Http\Controllers\Public\ShopController as PublicShopController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\EnsureUserIsActive;
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

// Shop routes
Route::get('/shop', [ShopController::class, 'index'])->name('shop.index');
Route::get('/shop/{category}', [ShopController::class, 'index'])->name('shop.category');
Route::get('/shop/{category}/{subcategory}', [ShopController::class, 'index'])->name('shop.subcategory');
Route::get('/products/{product}', [ShopController::class, 'show'])->name('products.show');

// Collections routes
Route::get('/collections', [CollectionController::class, 'index'])->name('collections.index');
Route::get('/collections/{handle}', [CollectionController::class, 'show'])->name('collections.show');

// Cart routes (Inertia pages)
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart', [CartController::class, 'store'])->name('cart.store')->middleware(EnsureUserIsActive::class);
Route::patch('/cart/{item}', [CartController::class, 'update'])->name('cart.update');
Route::delete('/cart/{item}', [CartController::class, 'destroy'])->name('cart.destroy');

// Cart API routes (JSON endpoints for AJAX - must be in web routes for session access)
Route::prefix('api/cart')->name('api.cart.')->group(function () {
    Route::get('count', [\App\Http\Controllers\Api\CartController::class, 'count'])->name('count');
    Route::get('/', [\App\Http\Controllers\Api\CartController::class, 'index'])->name('index');
    Route::post('add', [\App\Http\Controllers\Api\CartController::class, 'add'])->name('add')->middleware(EnsureUserIsActive::class);
    Route::post('buy-now', [\App\Http\Controllers\Api\CartController::class, 'buyNow'])->name('buy-now')->middleware(EnsureUserIsActive::class);

    // Coupon routes — MUST be declared before the {item} wildcard routes.
    // If placed after, DELETE api/cart/coupon would match {item}="coupon" (string)
    // and crash CartController::remove() which expects an int.
    Route::get('coupons', [\App\Http\Controllers\Api\CouponController::class, 'available'])->name('coupons');
    Route::post('coupon/apply', [\App\Http\Controllers\Api\CouponController::class, 'apply'])->name('coupon.apply');
    Route::delete('coupon', [\App\Http\Controllers\Api\CouponController::class, 'remove'])->name('coupon.remove');
    Route::post('coupon/validate', [\App\Http\Controllers\Api\CouponController::class, 'validate'])->name('coupon.validate');

    // Wildcard item routes — declared last so specific paths above take priority
    Route::put('{item}', [\App\Http\Controllers\Api\CartController::class, 'update'])->name('update');
    Route::delete('{item}', [\App\Http\Controllers\Api\CartController::class, 'remove'])->name('remove');
    Route::delete('/', [\App\Http\Controllers\Api\CartController::class, 'clear'])->name('clear');
});

// Live product search (JSON) — rate limited: 20 rpm guests / 60 rpm auth / 5 per 10 s burst
Route::get('api/search', [\App\Http\Controllers\Api\SearchController::class, 'search'])
    ->middleware('throttle:search')
    ->name('api.search');

// Reviews API routes
Route::prefix('api/reviews')->name('api.reviews.')->group(function () {
    Route::get('products/{productId}', [\App\Http\Controllers\Api\ReviewController::class, 'index'])->name('index');
    Route::get('products/{productId}/stats', [\App\Http\Controllers\Api\ReviewController::class, 'stats'])->name('stats');
    Route::post('products/{productId}', [\App\Http\Controllers\Api\ReviewController::class, 'store'])->name('store');
    Route::get('products/{productId}/can-review', [\App\Http\Controllers\Api\ReviewController::class, 'canReview'])->name('can-review');
    Route::post('{reviewId}/helpful', [\App\Http\Controllers\Api\ReviewController::class, 'markHelpful'])->name('helpful');
});

// Checkout routes (guest checkout allowed)
Route::get('/checkout', [CheckoutController::class, 'create'])->name('checkout.index');
Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store')->middleware(EnsureUserIsActive::class);
Route::get('/checkout/success/{order}', [CheckoutController::class, 'success'])
    ->middleware('throttle:20,1')
    ->name('checkout.success');

Route::get('/about', [PublicPageController::class, 'show'])
    ->defaults('slug', 'about')
    ->name('pages.about');
Route::get('/contact', [PageController::class, 'contact'])->name('pages.contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

// Blog Routes
Route::prefix('blog')->name('blog.')->group(function () {
    Route::get('/', [BlogController::class, 'index'])->name('index');
    Route::get('/category/{slug}', [BlogController::class, 'category'])->name('category');
    Route::get('/author/{slug}', [BlogController::class, 'author'])->name('author');
    Route::get('/{slug}', [BlogController::class, 'show'])->name('show');
});

// Policy pages - clean URLs
Route::get('/privacy-policy', [PublicPageController::class, 'show'])
    ->defaults('slug', 'privacy-policy')
    ->name('privacy-policy');
Route::get('/terms-of-service', [PublicPageController::class, 'show'])
    ->defaults('slug', 'terms-of-service')
    ->name('terms-of-service');
// /return-policy and /returns both serve the same CMS page (footer links to /returns)
Route::get('/return-policy', [PublicPageController::class, 'show'])
    ->defaults('slug', 'return-policy')
    ->name('return-policy');
Route::get('/returns', [PublicPageController::class, 'show'])
    ->defaults('slug', 'return-policy')
    ->name('returns');

// CMS Pages - supports hierarchical slugs like /page/about/team
Route::get('/page/{slug}', [PublicPageController::class, 'show'])
    ->where('slug', '[a-zA-Z0-9-_/]+')
    ->name('page.show');

// /pages/{slug} (plural) — legacy/DB-stored URLs; contact has its own handler
Route::redirect('/pages/contact', '/contact', 301);
Route::get('/pages/{slug}', [PublicPageController::class, 'show'])
    ->where('slug', '[a-zA-Z0-9-_/]+')
    ->name('pages.show');

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
        Route::resource('users', UserController::class)->only(['index', 'edit', 'update', 'destroy']);
        Route::patch('users/{user}/toggle-active', [UserController::class, 'toggleActive'])->name('users.toggle-active');
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

    Route::get('/orders', [\App\Http\Controllers\User\OrderHistoryController::class, 'index'])
        ->name('orders.index');
    Route::get('/orders/{order}', [\App\Http\Controllers\User\OrderHistoryController::class, 'show'])
        ->name('orders.show');
});

require __DIR__.'/auth.php';
