<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        $featuredProducts = Product::query()
            ->where('is_active', true)
            ->orderByDesc('id')
            ->limit(8)
            ->get([
                'id',
                'name',
                'slug',
                'short_description',
                'price',
                'compare_at_price',
                'image_url',
            ]);

        return Inertia::render('Storefront/Home', [
            'featuredProducts' => $featuredProducts,
        ]);
    }
}
