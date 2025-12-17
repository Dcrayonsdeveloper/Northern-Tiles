<?php

namespace App\Domain\Menu\Services;

use App\Domain\Menu\Models\Menu;
use App\Domain\Menu\Models\MenuItem;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class MenuService
{
    public function getByLocation(string $location): ?Menu
    {
        return Cache::rememberForever("menu.{$location}", function () use ($location) {
            return Menu::with(['items' => function ($query) {
                $query->where('is_active', true)->orderBy('sort_order');
            }])
                ->where('location', $location)
                ->where('is_active', true)
                ->first();
        });
    }

    public function getTree(string $location): array
    {
        $menu = $this->getByLocation($location);

        if (!$menu) {
            return [];
        }

        return $this->buildTree($menu->items);
    }

    public function buildTree(Collection $items, ?int $parentId = null): array
    {
        $branch = [];

        foreach ($items as $item) {
            if ($item->parent_id === $parentId) {
                $node = [
                    'id' => $item->id,
                    'label' => $item->label,
                    'url' => $item->getUrl(),
                    'target' => $item->target,
                    'icon' => $item->icon,
                    'css_class' => $item->css_class,
                    // Mega menu fields
                    'is_mega' => $item->is_mega,
                    'mega_columns' => $item->mega_columns,
                    'image_url' => $item->image_url,
                    'image_alt' => $item->image_alt,
                    'video_url' => $item->video_url,
                    'badge_text' => $item->badge_text,
                    'badge_color' => $item->badge_color,
                    'description' => $item->description,
                    'featured_content' => $item->featured_content,
                    'children' => $this->buildTree($items, $item->id),
                ];
                $branch[] = $node;
            }
        }

        return $branch;
    }

    public function create(array $data): Menu
    {
        $menu = Menu::create($data);
        $this->flushCache($menu->location);
        return $menu;
    }

    public function update(Menu $menu, array $data): Menu
    {
        $oldLocation = $menu->location;
        $menu->update($data);

        $this->flushCache($oldLocation);
        if ($oldLocation !== $menu->location) {
            $this->flushCache($menu->location);
        }

        return $menu;
    }

    public function delete(Menu $menu): bool
    {
        $location = $menu->location;
        $result = $menu->delete();
        $this->flushCache($location);
        return $result;
    }

    public function createItem(array $data): MenuItem
    {
        $item = MenuItem::create($data);

        if ($item->menu) {
            $this->flushCache($item->menu->location);
        }

        return $item;
    }

    public function updateItem(MenuItem $item, array $data): MenuItem
    {
        $item->update($data);

        if ($item->menu) {
            $this->flushCache($item->menu->location);
        }

        return $item;
    }

    public function deleteItem(MenuItem $item): bool
    {
        $location = $item->menu?->location;
        $result = $item->delete();

        if ($location) {
            $this->flushCache($location);
        }

        return $result;
    }

    public function reorderItems(array $itemIds): void
    {
        foreach ($itemIds as $index => $itemId) {
            MenuItem::where('id', $itemId)->update(['sort_order' => $index]);
        }

        $firstItem = MenuItem::find($itemIds[0] ?? null);
        if ($firstItem?->menu) {
            $this->flushCache($firstItem->menu->location);
        }
    }

    public function flushCache(?string $location = null): void
    {
        if ($location) {
            Cache::forget("menu.{$location}");
        } else {
            $locations = Menu::pluck('location')->unique();
            foreach ($locations as $loc) {
                Cache::forget("menu.{$loc}");
            }
        }
    }

    public function getLocations(): array
    {
        return [
            'header' => 'Header Navigation',
            'footer' => 'Footer Navigation',
            'mega_menu' => 'Mega Menu',
            'mobile' => 'Mobile Navigation',
            'sidebar' => 'Sidebar Navigation',
        ];
    }
}
