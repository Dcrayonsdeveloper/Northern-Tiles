<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(\App\Domain\Menu\Services\MenuService::class);
        $this->app->singleton(\App\Domain\CMS\Services\CMSService::class);
        $this->app->singleton(\App\Domain\Catalog\Services\CatalogService::class);
        $this->app->singleton(\App\Domain\Catalog\Services\TagService::class);
        $this->app->singleton(\App\Domain\Catalog\Services\FavoriteService::class);
        $this->app->singleton(\App\Domain\Cart\Services\CartService::class);
        $this->app->singleton(\App\Domain\Cart\Services\OrderService::class);
        $this->app->singleton(\App\Domain\Personalization\Services\PersonalizationService::class);
        $this->app->singleton(\App\Domain\SEO\Services\SeoService::class);
        $this->app->singleton(\App\Domain\Marketing\Services\MarketingService::class);
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        $this->registerPolicies();
    }

    protected function registerPolicies(): void
    {
        Gate::policy(\App\Models\Product::class, \App\Domain\Catalog\Policies\ProductPolicy::class);
        Gate::policy(\App\Models\Order::class, \App\Domain\Cart\Policies\OrderPolicy::class);
        Gate::policy(\App\Domain\CMS\Models\Page::class, \App\Domain\CMS\Policies\PagePolicy::class);
        Gate::policy(\App\Domain\CMS\Models\Post::class, \App\Domain\CMS\Policies\PostPolicy::class);
        Gate::policy(\App\Domain\CMS\Models\Author::class, \App\Domain\CMS\Policies\AuthorPolicy::class);
    }
}
