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
}
