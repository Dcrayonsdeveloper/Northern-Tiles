<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'category']);

        $products = Product::query()
            ->where('is_active', true)
            ->when($request->string('q')->isNotEmpty(), function ($query) use ($request) {
                $q = $request->string('q')->toString();
                $query->where(function ($sub) use ($q) {
                    $sub->where('name', 'like', "%{$q}%")
                        ->orWhere('short_description', 'like', "%{$q}%");
                });
            })
            ->when($request->string('category')->isNotEmpty(), function ($query) use ($request) {
                $slug = $request->string('category')->toString();
                $query->whereHas('category', fn ($q) => $q->where('slug', $slug));
            })
            ->with(['category:id,name,slug'])
            ->orderByDesc('id')
            ->paginate(12)
            ->withQueryString();

        $categories = Category::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Storefront/Shop/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $filters,
        ]);
    }

    public function show(Product $product): Response
    {
        abort_unless($product->is_active, 404);

        $product->loadMissing(['category:id,name,slug']);

        return Inertia::render('Storefront/Shop/Show', [
            'product' => $product,
        ]);
    }
}
