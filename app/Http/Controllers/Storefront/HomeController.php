<?php

namespace App\Http\Controllers\Storefront;

use App\Domain\Home\Services\HomeService;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(HomeService $homeService): Response
    {
        $homeData = $homeService->getHomeData();

        // Merged rather than folded into getHomeData(): that payload is the
        // CMS section list, cached for an hour, and the category strip has to
        // track the catalogue on a shorter leash than the page layout does.
        $homeData['rootCategories'] = $homeService->rootCategories();
        $homeData['trendingProducts'] = $homeService->trendingProducts();
        $homeData['tileFinder'] = $homeService->tileFinder();

        return Inertia::render('Storefront/Home', $homeData);
    }
}
