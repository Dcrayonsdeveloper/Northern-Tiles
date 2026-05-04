<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->input('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json(['results' => [], 'query' => $q]);
        }

        $like = '%' . str_replace(['%', '_'], ['\%', '\_'], $q) . '%';

        $products = Product::query()
            ->where('is_active', true)
            ->where(function ($sub) use ($like) {
                $sub->where('name', 'like', $like)
                    ->orWhere('short_description', 'like', $like)
                    ->orWhere('brand', 'like', $like);
            })
            ->with(['category:id,name,slug'])
            ->orderByRaw('CASE WHEN name LIKE ? THEN 0 ELSE 1 END', [$q . '%'])
            ->orderBy('name')
            ->limit(8)
            ->get(['id', 'name', 'slug', 'price', 'image_url', 'category_id']);

        $results = $products->map(fn ($p) => [
            'id' => $p->id,
            'name' => $p->name,
            'slug' => $p->slug,
            'price' => $p->price,
            'image_url' => $p->image_url ?: '/images/placeholder-product.svg',
            'category' => $p->category ? ['name' => $p->category->name, 'slug' => $p->category->slug] : null,
            'url' => '/products/' . $p->slug,
        ]);

        return response()->json([
            'results' => $results,
            'query' => $q,
            'total' => $results->count(),
        ]);
    }
}
