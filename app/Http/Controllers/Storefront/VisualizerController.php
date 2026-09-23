<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VisualizerController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::query()
            ->where('is_active', true)
            ->whereNotNull('image_url')
            ->where('image_url', '!=', '')
            ->with(['category:id,name,slug'])
            ->select([
                'id',
                'name',
                'slug',
                'sku',
                'image_url',
                'price',
                'category_id',
                'unit_label',
            ])
            ->orderByDesc('is_featured')
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        $categories = Category::query()
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Storefront/Visualizer', [
            'products' => $products,
            'categories' => $categories,
        ]);
    }
}
