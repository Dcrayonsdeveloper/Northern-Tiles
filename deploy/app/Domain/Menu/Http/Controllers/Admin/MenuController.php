<?php

namespace App\Domain\Menu\Http\Controllers\Admin;

use App\Domain\Menu\Http\Requests\StoreMenuRequest;
use App\Domain\Menu\Models\Menu;
use App\Domain\Menu\Services\MenuService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function __construct(
        protected MenuService $menuService
    ) {}

    public function index(): Response
    {
        $menus = Menu::withCount('items')->get();

        return Inertia::render('Admin/Menus/Index', [
            'menus' => $menus,
            'locations' => $this->menuService->getLocations(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Menus/Create', [
            'locations' => $this->menuService->getLocations(),
        ]);
    }

    public function store(StoreMenuRequest $request)
    {
        $this->menuService->create($request->validated());

        return redirect()->route('admin.menus.index')
            ->with('success', 'Menu created successfully');
    }

    public function edit(Menu $menu): Response
    {
        $menu->load(['items' => function ($q) {
            $q->orderBy('sort_order');
        }]);

        $tree = $menu->getTree();

        return Inertia::render('Admin/Menus/Edit', [
            'menu' => $menu,
            'menuTree' => $tree,
            'locations' => $this->menuService->getLocations(),
        ]);
    }

    public function update(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:menus,slug,' . $menu->id,
            'location' => 'required|string|max:50',
            'is_active' => 'nullable|boolean',
        ]);

        $this->menuService->update($menu, $validated);

        return redirect()->route('admin.menus.index')
            ->with('success', 'Menu updated successfully');
    }

    public function destroy(Menu $menu)
    {
        $this->menuService->delete($menu);

        return redirect()->route('admin.menus.index')
            ->with('success', 'Menu deleted successfully');
    }

    public function storeItem(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:menu_items,id',
            'label' => 'required|string|max:191',
            'url' => 'nullable|string|max:500',
            'route_name' => 'nullable|string|max:100',
            'route_params' => 'nullable|array',
            'target' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:100',
            'css_class' => 'nullable|string|max:100',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['menu_id'] = $menu->id;

        $this->menuService->createItem($validated);

        return back()->with('success', 'Menu item created successfully');
    }

    public function updateItem(Request $request, Menu $menu, int $itemId)
    {
        $item = $menu->items()->findOrFail($itemId);

        $validated = $request->validate([
            'parent_id' => 'nullable|exists:menu_items,id',
            'label' => 'required|string|max:191',
            'url' => 'nullable|string|max:500',
            'route_name' => 'nullable|string|max:100',
            'route_params' => 'nullable|array',
            'target' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:100',
            'css_class' => 'nullable|string|max:100',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $this->menuService->updateItem($item, $validated);

        return back()->with('success', 'Menu item updated successfully');
    }

    public function destroyItem(Menu $menu, int $itemId)
    {
        $item = $menu->items()->findOrFail($itemId);

        $this->menuService->deleteItem($item);

        return back()->with('success', 'Menu item deleted successfully');
    }

    public function reorderItems(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*' => 'exists:menu_items,id',
        ]);

        $this->menuService->reorderItems($validated['items']);

        return back()->with('success', 'Menu items reordered successfully');
    }

    /**
     * Sync all menu items (handles create, update, delete in one call)
     */
    public function syncItems(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'nullable',
            'items.*.title' => 'required|string|max:191',
            'items.*.url' => 'nullable|string|max:500',
            'items.*.target' => 'nullable|string|max:20',
            'items.*.icon' => 'nullable|string|max:100',
            'items.*.css_class' => 'nullable|string|max:100',
            // Mega menu fields
            'items.*.is_mega' => 'nullable|boolean',
            'items.*.mega_columns' => 'nullable|integer|min:1|max:5',
            'items.*.image_url' => 'nullable|string|max:500',
            'items.*.image_alt' => 'nullable|string|max:191',
            'items.*.video_url' => 'nullable|string|max:500',
            'items.*.badge_text' => 'nullable|string|max:50',
            'items.*.badge_color' => 'nullable|string|max:20',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.featured_content' => 'nullable|array',
            'items.*.children' => 'nullable|array',
        ]);

        $this->syncItemsRecursive($menu, $validated['items'], null);

        // Delete items not in the sync
        $keepIds = $this->collectItemIds($validated['items']);
        $menu->items()->whereNotIn('id', $keepIds)->delete();

        $this->menuService->flushCache($menu->location);

        return back()->with('success', 'Menu items synced successfully');
    }

    protected function syncItemsRecursive(Menu $menu, array $items, ?int $parentId, int &$sortOrder = 0): void
    {
        foreach ($items as $itemData) {
            $isNew = !isset($itemData['id']) || str_starts_with((string) $itemData['id'], 'new-');

            $data = [
                'menu_id' => $menu->id,
                'parent_id' => $parentId,
                'label' => $itemData['title'],
                'url' => $itemData['url'] ?? null,
                'target' => $itemData['target'] ?? '_self',
                'icon' => $itemData['icon'] ?? null,
                'css_class' => $itemData['css_class'] ?? null,
                'sort_order' => $sortOrder++,
                'is_active' => true,
                // Mega menu fields
                'is_mega' => $itemData['is_mega'] ?? false,
                'mega_columns' => $itemData['mega_columns'] ?? 4,
                'image_url' => $itemData['image_url'] ?? null,
                'image_alt' => $itemData['image_alt'] ?? null,
                'video_url' => $itemData['video_url'] ?? null,
                'badge_text' => $itemData['badge_text'] ?? null,
                'badge_color' => $itemData['badge_color'] ?? null,
                'description' => $itemData['description'] ?? null,
                'featured_content' => $itemData['featured_content'] ?? null,
            ];

            if ($isNew) {
                $item = $menu->items()->create($data);
            } else {
                $item = $menu->items()->find($itemData['id']);
                if ($item) {
                    $item->update($data);
                } else {
                    $item = $menu->items()->create($data);
                }
            }

            if (!empty($itemData['children'])) {
                $this->syncItemsRecursive($menu, $itemData['children'], $item->id, $sortOrder);
            }
        }
    }

    protected function collectItemIds(array $items): array
    {
        $ids = [];
        foreach ($items as $item) {
            if (isset($item['id']) && !str_starts_with((string) $item['id'], 'new-')) {
                $ids[] = $item['id'];
            }
            if (!empty($item['children'])) {
                $ids = array_merge($ids, $this->collectItemIds($item['children']));
            }
        }
        return $ids;
    }
}
