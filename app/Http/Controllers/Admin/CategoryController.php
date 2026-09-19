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
        $all = Category::query()
            ->orderBy('sort')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'parent_id', 'created_at']);

        // Roots first, each followed by its own children, so the list reads as
        // the tree it is. Sorted flat by name it was impossible to tell a root
        // from a sub-category, or which root a sub-category belonged to.
        $children = $all->whereNotNull('parent_id')->groupBy('parent_id');

        $ordered = $all
            ->whereNull('parent_id')
            ->flatMap(fn ($root) => collect([
                array_merge($root->only(['id', 'name', 'slug', 'created_at']), [
                    'is_root' => true,
                    'product_count' => $root->products()->count(),
                ]),
            ])->concat(
                $children->get($root->id, collect())->map(fn ($child) => array_merge(
                    $child->only(['id', 'name', 'slug', 'created_at']),
                    ['is_root' => false, 'product_count' => $child->products()->count()],
                ))
            ))
            ->values();

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $ordered,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Categories/Create', [
            'parents' => $this->parentOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            // Only a root may be a parent: the storefront nav draws roots
            // across the bar and their children in one dropdown, so a third
            // level would simply not be rendered anywhere.
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        $slugBase = Str::slug($validated['slug'] ?: $validated['name']);
        $slug = $this->uniqueSlug($slugBase);

        Category::query()->create([
            'name' => $validated['name'],
            'slug' => $slug,
            'parent_id' => $this->resolveParent($validated['parent_id'] ?? null),
            'is_active' => true,
        ]);

        return redirect()->route('admin.categories.index');
    }

    public function edit(Category $category): Response
    {
        return Inertia::render('Admin/Categories/Edit', [
            'category' => $category->only(['id', 'name', 'slug', 'parent_id']),
            // A category that already has children cannot itself become a
            // child, and nothing may be its own parent.
            'parents' => $this->parentOptions($category->id),
            'child_count' => Category::where('parent_id', $category->id)->count(),
        ]);
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        $parentId = $this->resolveParent($validated['parent_id'] ?? null, $category);

        $slugBase = Str::slug($validated['slug'] ?: $validated['name']);
        $slug = $this->uniqueSlug($slugBase, $category->id);

        $category->update([
            'name' => $validated['name'],
            'slug' => $slug,
            'parent_id' => $parentId,
        ]);

        return redirect()->route('admin.categories.index');
    }

    /**
     * Roots that may be chosen as a parent, newest tree order.
     *
     * $exclude keeps a category from being offered itself.
     */
    private function parentOptions(?int $exclude = null): array
    {
        return Category::query()
            ->whereNull('parent_id')
            ->when($exclude, fn ($q, $id) => $q->whereKeyNot($id))
            ->orderBy('sort')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->all();
    }

    /**
     * Keeps the tree two levels deep and acyclic.
     *
     * Silently refuses rather than erroring: the select cannot offer these
     * choices, so reaching here means a hand-crafted request, and the safe
     * answer is to leave the category where it is.
     */
    private function resolveParent(?int $parentId, ?Category $moving = null): ?int
    {
        if (! $parentId) {
            return null;
        }

        if ($moving && $parentId === $moving->id) {
            return $moving->parent_id;
        }

        $parent = Category::find($parentId);

        // Nesting under a child would make a third level.
        if (! $parent || $parent->parent_id !== null) {
            return $moving?->parent_id;
        }

        // A category with children of its own cannot become a child.
        if ($moving && Category::where('parent_id', $moving->id)->exists()) {
            return $moving->parent_id;
        }

        return $parent->id;
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
