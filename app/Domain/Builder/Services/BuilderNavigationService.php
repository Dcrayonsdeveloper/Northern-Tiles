<?php

namespace App\Domain\Builder\Services;

use App\Models\Category;
use Illuminate\Support\Collection;

/**
 * The trade portal's category navigation.
 *
 * Lives here rather than in a controller because every page in the portal
 * renders the same header. When this query sat inline in the shop controller,
 * only the shop page had categories and the nav collapsed to "All Products"
 * everywhere else.
 */
class BuilderNavigationService
{
    /** Resolved once per request — the header is rendered on every response. */
    private ?Collection $memo = null;

    /**
     * Top-level categories that actually contain live builder products, each
     * with its qualifying children. An empty category in the trade nav is just
     * a dead end, so they are excluded.
     */
    public function categories(): Collection
    {
        if ($this->memo !== null) {
            return $this->memo;
        }

        $hasLiveBuilderProduct = fn ($query) => $query->where('is_active', true)
            ->whereHas('builderListing', fn ($b) => $b->where('is_active', true));

        return $this->memo = Category::query()
            ->whereNull('parent_id')
            ->whereHas('products', $hasLiveBuilderProduct)
            ->with(['children' => fn ($q) => $q
                ->whereHas('products', $hasLiveBuilderProduct)
                ->orderBy('name')
                ->select('id', 'parent_id', 'name', 'slug')])
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);
    }
}
