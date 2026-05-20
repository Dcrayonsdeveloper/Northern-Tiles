<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    // InnoDB FULLTEXT minimum token length (server default).
    // Tokens shorter than this are ignored by FULLTEXT — we fall back to LIKE instead.
    private const FT_MIN_TOKEN_LEN = 3;

    // Hard cap on tokens to prevent runaway queries.
    private const MAX_TOKENS = 8;

    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->input('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json(['products' => [], 'categories' => [], 'query' => $q]);
        }

        // Authenticated admins can find inactive/draft products; guests and storefront
        // users only see active products.
        $isAdmin = auth()->check() && auth()->user()?->is_admin;

        $rawTokens = array_slice(
            preg_split('/\s+/', $q, -1, PREG_SPLIT_NO_EMPTY),
            0,
            self::MAX_TOKENS
        );

        $escapeForLike = fn (string $v): string =>
            str_replace(['%', '_'], ['\%', '\_'], $v);

        $tokenLikes = array_map(fn ($t) => '%' . $escapeForLike($t) . '%', $rawTokens);
        $phraseLike = '%' . $escapeForLike($q) . '%';

        // Use FULLTEXT when every token meets the minimum length.
        // Fall through to LIKE-based search otherwise (or on any DB exception).
        $allTokensLongEnough = min(array_map('mb_strlen', $rawTokens)) >= self::FT_MIN_TOKEN_LEN;

        [$products, $categories] = $allTokensLongEnough
            ? $this->fulltextSearch($rawTokens, $tokenLikes, $phraseLike, $isAdmin)
            : $this->likeSearch($rawTokens, $tokenLikes, $phraseLike, $isAdmin);

        return response()->json([
            'products'   => $products,
            'categories' => $categories,
            'query'      => $q,
            'total'      => count($products) + count($categories),
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Tier 1 — MySQL FULLTEXT (boolean mode)
    // Fast, relevance-scored, handles partial token prefixes via the * wildcard.
    // Falls back to LIKE if the index is missing or the engine rejects the query.
    // ──────────────────────────────────────────────────────────────────────────

    private function fulltextSearch(array $rawTokens, array $tokenLikes, string $phraseLike, bool $isAdmin = false): array
    {
        // Build boolean-mode query: each token is required (+) with prefix wildcard (*).
        // Strip characters that have special meaning in boolean mode to prevent injection.
        $booleanQuery = implode(' ', array_map(
            fn ($t) => '+' . preg_replace('/[+\-><()*~"@]+/', '', $t) . '*',
            $rawTokens
        ));

        try {
            $categories = Category::query()
                ->where('is_active', true)
                ->whereRaw(
                    'MATCH(name) AGAINST(? IN BOOLEAN MODE)',
                    [$booleanQuery]
                )
                ->orderByRaw(
                    'MATCH(name) AGAINST(? IN BOOLEAN MODE) DESC',
                    [$booleanQuery]
                )
                ->orderBy('sort')
                ->orderBy('name')
                ->limit(4)
                ->get(['id', 'name', 'slug', 'image_path'])
                ->map($this->mapCategory(...))
                ->values()
                ->all();

            $products = Product::query()
                ->when(!$isAdmin, fn ($q) => $q->where('is_active', true))
                ->where(function ($sub) use ($booleanQuery, $tokenLikes) {
                    // Primary: FULLTEXT match across product fields.
                    $sub->whereRaw(
                        'MATCH(name, sku, brand, short_description) AGAINST(? IN BOOLEAN MODE)',
                        [$booleanQuery]
                    );
                    // Secondary: tag matches (tags live in a separate table, can't be in FULLTEXT).
                    foreach ($tokenLikes as $like) {
                        $sub->orWhereHas('tags', fn ($tq) => $tq->where('name', 'like', $like));
                    }
                })
                ->with(['category:id,name,slug'])
                // Order: FULLTEXT relevance first, then exact-phrase-in-name, then alpha.
                ->orderByRaw(
                    'MATCH(name, sku, brand, short_description) AGAINST(? IN BOOLEAN MODE) DESC',
                    [$booleanQuery]
                )
                ->orderByRaw('CASE WHEN name LIKE ? THEN 0 ELSE 1 END', [$phraseLike])
                ->orderBy('name')
                ->limit(6)
                ->get(['id', 'name', 'slug', 'sku', 'price', 'image_url', 'category_id'])
                ->map($this->mapProduct(...))
                ->values()
                ->all();

            return [$products, $categories];
        } catch (\Throwable) {
            // FULLTEXT index may not be active yet — degrade gracefully.
            return $this->likeSearch($rawTokens, $tokenLikes, $phraseLike, $isAdmin);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Tier 2/3 — LIKE-based search
    // Tier 2: every token must appear in at least one field (AND across tokens).
    // Tier 3: if Tier 2 returns nothing, any token can match (OR across tokens).
    // ──────────────────────────────────────────────────────────────────────────

    private function likeSearch(array $rawTokens, array $tokenLikes, string $phraseLike, bool $isAdmin = false): array
    {
        $categories = $this->likeCategories($tokenLikes, $phraseLike);

        // Tier 2 — AND (all tokens must match somewhere).
        $products = $this->likeProducts(
            fn ($query) => $this->applyAndTokens($query, $tokenLikes),
            $phraseLike,
            $isAdmin
        );

        // Tier 3 — OR fallback (any token match) for long/partial queries.
        if (empty($products) && count($tokenLikes) > 1) {
            $products = $this->likeProducts(
                fn ($query) => $this->applyOrTokens($query, $tokenLikes),
                $phraseLike,
                $isAdmin
            );
        }

        return [$products, $categories];
    }

    private function likeCategories(array $tokenLikes, string $phraseLike): array
    {
        return Category::query()
            ->where('is_active', true)
            ->where(function ($sub) use ($tokenLikes) {
                foreach ($tokenLikes as $like) {
                    $sub->where('name', 'like', $like);
                }
            })
            ->orderByRaw('CASE WHEN name LIKE ? THEN 0 ELSE 1 END', [$phraseLike])
            ->orderBy('sort')
            ->orderBy('name')
            ->limit(4)
            ->get(['id', 'name', 'slug', 'image_path'])
            ->map($this->mapCategory(...))
            ->values()
            ->all();
    }

    private function likeProducts(\Closure $applyTokens, string $phraseLike, bool $isAdmin = false): array
    {
        return Product::query()
            ->when(!$isAdmin, fn ($q) => $q->where('is_active', true))
            ->where(function ($query) use ($applyTokens) {
                $applyTokens($query);
            })
            ->with(['category:id,name,slug'])
            ->orderByRaw('CASE WHEN name LIKE ? THEN 0 ELSE 1 END', [$phraseLike])
            ->orderBy('name')
            ->limit(6)
            ->get(['id', 'name', 'slug', 'sku', 'price', 'image_url', 'category_id'])
            ->map($this->mapProduct(...))
            ->values()
            ->all();
    }

    // Every token must appear in at least one field (AND across tokens, OR across fields).
    private function applyAndTokens($query, array $tokenLikes): void
    {
        foreach ($tokenLikes as $like) {
            $query->where(function ($group) use ($like) {
                $group->where('name', 'like', $like)
                    ->orWhere('sku', 'like', $like)
                    ->orWhere('brand', 'like', $like)
                    ->orWhere('short_description', 'like', $like)
                    ->orWhereHas('tags', fn ($tq) => $tq->where('name', 'like', $like));
            });
        }
    }

    // Any token matching any field is enough (OR across tokens and fields).
    private function applyOrTokens($query, array $tokenLikes): void
    {
        $query->where(function ($group) use ($tokenLikes) {
            foreach ($tokenLikes as $like) {
                $group->orWhere('name', 'like', $like)
                    ->orWhere('sku', 'like', $like)
                    ->orWhere('brand', 'like', $like)
                    ->orWhere('short_description', 'like', $like)
                    ->orWhereHas('tags', fn ($tq) => $tq->where('name', 'like', $like));
            }
        });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Result mappers
    // ──────────────────────────────────────────────────────────────────────────

    private function mapCategory(Category $c): array
    {
        return [
            'id'        => $c->id,
            'name'      => $c->name,
            'slug'      => $c->slug,
            'image_url' => $c->image_url,
            'url'       => '/shop?category=' . $c->slug,
        ];
    }

    private function mapProduct(Product $p): array
    {
        return [
            'id'        => $p->id,
            'name'      => $p->name,
            'slug'      => $p->slug,
            'price'     => $p->price,
            'image_url' => $p->image_url ?: '/images/placeholder-product.svg',
            'category'  => $p->category
                ? ['name' => $p->category->name, 'slug' => $p->category->slug]
                : null,
            'url'       => '/products/' . $p->slug,
        ];
    }
}
