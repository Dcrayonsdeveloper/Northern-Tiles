<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        $products = Product::query()
            ->with(['category:id,name,slug'])
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
        ]);
    }

    public function create(): Response
    {
        $categories = Category::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Products/Create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'short_description' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);

        $slugBase = Str::slug($validated['slug'] ?: $validated['name']);
        $validated['slug'] = $this->uniqueSlug($slugBase);

        Product::query()->create($validated);

        return redirect()->route('admin.products.index');
    }

    public function edit(Product $product): Response
    {
        $product->loadMissing(['category:id,name']);
        $categories = Category::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Products/Edit', [
            'product' => $product->only([
                'id',
                'category_id',
                'name',
                'slug',
                'short_description',
                'description',
                'price',
                'compare_at_price',
                'image_url',
                'stock',
                'is_active',
            ]),
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'short_description' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);

        $slugBase = Str::slug($validated['slug'] ?: $validated['name']);
        $validated['slug'] = $this->uniqueSlug($slugBase, $product->id);

        $product->update($validated);

        return redirect()->route('admin.products.index');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()->route('admin.products.index');
    }

    private function uniqueSlug(string $slugBase, ?int $ignoreId = null): string
    {
        $base = $slugBase ?: 'product';
        $slug = $base;
        $i = 2;

        while (
            Product::query()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base . '-' . $i;
            $i++;
        }

        return $slug;
    }
}
