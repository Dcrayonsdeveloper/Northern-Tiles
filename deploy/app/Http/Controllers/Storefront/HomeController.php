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

        return Inertia::render('Storefront/Home', $homeData);
    }
}
