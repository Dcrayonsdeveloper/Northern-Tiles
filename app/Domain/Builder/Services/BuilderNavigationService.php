<?php

namespace App\Domain\Builder\Services;

use App\Models\Category;
use App\Models\User;
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
    /**
     * Resolved once per request — the header is rendered on every response.
     * Keyed by account because an account with its own catalogue navigates a
     * different set of categories than the shared list.
     *
     * @var array<string, Collection>
     */
    private array $memo = [];

    /**
     * Top-level categories that actually contain live builder products, each
     * with its qualifying children. An empty category in the trade nav is just
     * a dead end, so they are excluded.
     */
    public function categories(?User $user = null): Collection
    {
        $key = $user?->id ? 'u' . $user->id : 'shared';

        if (isset($this->memo[$key])) {
            return $this->memo[$key];
        }

        // builderVisibleTo, not builderListing: an account with its own
        // catalogue was being offered the shared list's categories, every one
        // of which filtered down to an empty grid for them.
        $hasLiveBuilderProduct = fn ($query) => $query->where('is_active', true)
            ->builderVisibleTo($user);

        return $this->memo[$key] = Category::query()
            ->whereNull('parent_id')
            // A root qualifies on its own products OR on any child's. Since the
            // category rebuild every product hangs off a sub-category, so
            // requiring products directly on the root excluded all seven roots
            // and collapsed the trade nav to "All Products".
            ->where(fn ($q) => $q
                ->whereHas('products', $hasLiveBuilderProduct)
                ->orWhereHas('children', fn ($c) => $c->whereHas('products', $hasLiveBuilderProduct)))
            ->with(['children' => fn ($q) => $q
                ->whereHas('products', $hasLiveBuilderProduct)
                ->orderBy('name')
                ->select('id', 'parent_id', 'name', 'slug')])
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);
    }
}
