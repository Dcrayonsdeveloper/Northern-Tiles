<?php

namespace App\Http\Controllers\Storefront;

use App\Domain\Catalog\Models\VisualizerRoom;
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
        // Fetch active rooms from database
        $rooms = VisualizerRoom::query()
            ->active()
            ->ordered()
            ->get()
            ->map(fn ($room) => [
                'id' => $room->slug,
                'name' => $room->name,
                'image' => $room->image_url,
                'floorBounds' => $room->floor_bounds_array,
                'featuredProductIds' => $room->products()->pluck('products.id')->toArray(),
            ]);

        // If no rooms in database, use fallback
        if ($rooms->isEmpty()) {
            $rooms = collect([
                [
                    'id' => 'living-room',
                    'name' => 'Living Room',
                    'image' => '/images/visualizerimg/qq.webp',
                    'floorBounds' => ['x' => 0, 'y' => 0, 'width' => 100, 'height' => 100],
                    'featuredProductIds' => [],
                ],
            ]);
        }

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
            'rooms' => $rooms,
            'products' => $products,
            'categories' => $categories,
        ]);
    }
}
