<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = Category::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'created_at']);

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Categories/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
        ]);

        $slugBase = Str::slug($validated['slug'] ?: $validated['name']);
        $slug = $this->uniqueSlug($slugBase);

        Category::query()->create([
            'name' => $validated['name'],
            'slug' => $slug,
        ]);

        return redirect()->route('admin.categories.index');
    }

    public function edit(Category $category): Response
    {
        return Inertia::render('Admin/Categories/Edit', [
            'category' => $category->only(['id', 'name', 'slug']),
        ]);
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
        ]);

        $slugBase = Str::slug($validated['slug'] ?: $validated['name']);
        $slug = $this->uniqueSlug($slugBase, $category->id);

        $category->update([
            'name' => $validated['name'],
            'slug' => $slug,
        ]);

        return redirect()->route('admin.categories.index');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $category->delete();

        return redirect()->route('admin.categories.index');
    }

    private function uniqueSlug(string $slugBase, ?int $ignoreId = null): string
    {
        $base = $slugBase ?: 'category';
        $slug = $base;
        $i = 2;

        while (
            Category::query()
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
