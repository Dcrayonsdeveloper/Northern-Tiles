<?php

namespace App\Http\Controllers\Storefront;

use App\Domain\Catalog\Models\Collection;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CollectionController extends Controller
{
    public function index(): Response
    {
        $collections = Collection::query()
            ->active()
            ->orderBy('title')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->display_title,
                'handle' => $c->handle,
                'description' => $c->display_description,
                'image_url' => $c->image_url,
                'product_count' => $c->getProductCount(),
            ]);

        return Inertia::render('Storefront/Collections/Index', [
            'collections' => $collections,
        ]);
    }

    public function show(string $handle): Response
    {
        $collection = Collection::where('handle', $handle)
            ->active()
            ->firstOrFail();

        $products = $collection->getSortedProducts()
            ->with(['category:id,name,slug'])
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Storefront/Collections/Show', [
            'collection' => [
                'id' => $collection->id,
                'title' => $collection->display_title,
                'handle' => $collection->handle,
                'description' => $collection->display_description,
                'image_url' => $collection->image_url,
                'brochure_url' => $collection->brochure_url,
                'meta_title' => $collection->meta_title,
                'meta_description' => $collection->meta_description,
            ],
            'products' => $products,
        ]);
    }
}
