<?php

namespace App\Domain\CMS\Services;

use App\Domain\CMS\Models\Page;
use App\Domain\CMS\Models\PageSection;
use App\Domain\CMS\Models\SectionRegistry;
use App\Jobs\RebuildPageSlugsJob;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class PageService
{
    /**
     * Get all pages in a hierarchical structure for admin listing.
     */
    public function getHierarchicalPages(): Collection
    {
        $pages = Page::with(['parent', 'children', 'author'])
            ->orderBy('sort')
            ->orderBy('title')
            ->get();

        return $this->buildTree($pages);
    }

    /**
     * Get flat list of pages for parent dropdown (with indentation indicator).
     */
    public function getPagesForParentSelect(?int $excludeId = null): Collection
    {
        $pages = Page::query()
            ->select(['id', 'parent_id', 'title', 'full_slug'])
            ->orderBy('full_slug')
            ->get();

        if ($excludeId) {
            $excludeIds = $this->getDescendantIds($excludeId);
            $excludeIds[] = $excludeId;
            $pages = $pages->reject(fn($page) => in_array($page->id, $excludeIds));
        }

        return $pages->map(function ($page) {
            $depth = substr_count($page->full_slug ?? '', '/');
            return [
                'id' => $page->id,
                'title' => str_repeat('— ', $depth) . $page->title,
                'full_slug' => $page->full_slug,
                'depth' => $depth,
            ];
        });
    }

    /**
     * Generate a unique slug based on title and parent scope.
     */
    public function generateUniqueSlug(string $title, ?int $parentId = null, ?int $excludeId = null): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        while ($this->slugExistsInScope($slug, $parentId, $excludeId)) {
            $counter++;
            $slug = $baseSlug . '-' . $counter;
        }

        return $slug;
    }

    /**
     * Check if a slug exists within a parent scope.
     */
    public function slugExistsInScope(string $slug, ?int $parentId, ?int $excludeId = null): bool
    {
        $query = Page::where('slug', $slug)
            ->where('parent_id', $parentId);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Check if a full slug is unique globally.
     */
    public function fullSlugExists(string $fullSlug, ?int $excludeId = null): bool
    {
        $query = Page::where('full_slug', $fullSlug);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Validate that parent assignment doesn't create a cycle.
     */
    public function wouldCreateCycle(int $pageId, ?int $newParentId): bool
    {
        if ($newParentId === null) {
            return false;
        }

        if ($pageId === $newParentId) {
            return true;
        }

        $descendantIds = $this->getDescendantIds($pageId);

        return in_array($newParentId, $descendantIds);
    }

    /**
     * Get all descendant IDs of a page.
     */
    public function getDescendantIds(int $pageId): array
    {
        $ids = [];
        $children = Page::where('parent_id', $pageId)->pluck('id')->all();

        foreach ($children as $childId) {
            $ids[] = $childId;
            $ids = array_merge($ids, $this->getDescendantIds($childId));
        }

        return $ids;
    }

    /**
     * Create a new page with sections.
     */
    public function createPage(array $data, array $sections = []): Page
    {
        $page = Page::create($data);

        if (!empty($sections)) {
            $this->syncSections($page, $sections);
        }

        return $page->fresh(['sections', 'parent']);
    }

    /**
     * Update a page and handle slug cascade if needed.
     */
    public function updatePage(Page $page, array $data, array $sections = []): Page
    {
        $slugChanged = isset($data['slug']) && $page->slug !== $data['slug'];
        $parentChanged = array_key_exists('parent_id', $data) && $page->parent_id !== $data['parent_id'];

        $page->update($data);

        if (!empty($sections)) {
            $this->syncSections($page, $sections);
        }

        // Dispatch job to update descendant slugs if slug or parent changed
        if (($slugChanged || $parentChanged) && $page->hasChildren()) {
            RebuildPageSlugsJob::dispatch($page->id);
        }

        return $page->fresh(['sections', 'parent']);
    }

    /**
     * Sync sections for a page.
     */
    public function syncSections(Page $page, array $sections): void
    {
        // Delete existing sections
        $page->sections()->delete();

        // Create new sections
        foreach ($sections as $index => $sectionData) {
            if (!isset($sectionData['section_key'])) {
                continue;
            }

            PageSection::create([
                'page_id' => $page->id,
                'section_key' => $sectionData['section_key'],
                'data_json' => $sectionData['data_json'] ?? [],
                'sort' => $sectionData['sort'] ?? ($index * 10),
                'is_active' => $sectionData['is_active'] ?? true,
            ]);
        }
    }

    /**
     * Get available sections from registry.
     */
    public function getAvailableSections(?string $role = 'admin'): Collection
    {
        return SectionRegistry::active()
            ->ordered()
            ->get()
            ->filter(fn($section) => $section->isAvailableForRole($role))
            ->groupBy('category');
    }

    /**
     * Rebuild full slugs for a page and all its descendants.
     */
    public function rebuildDescendantSlugs(int $pageId): void
    {
        $page = Page::find($pageId);

        if (!$page) {
            return;
        }

        $children = Page::where('parent_id', $pageId)->get();

        foreach ($children as $child) {
            $newFullSlug = trim($page->full_slug, '/') . '/' . $child->slug;

            if ($child->full_slug !== $newFullSlug) {
                $child->update(['full_slug' => $newFullSlug]);
            }

            // Recursively update descendants
            if ($child->hasChildren()) {
                $this->rebuildDescendantSlugs($child->id);
            }
        }
    }

    /**
     * Get a page by full slug for public display.
     */
    public function getPublishedPageBySlug(string $fullSlug): ?Page
    {
        return Page::published()
            ->byFullSlug($fullSlug)
            ->with(['activeSections.registry', 'author'])
            ->first();
    }

    /**
     * Get page for preview (any status).
     */
    public function getPageForPreview(int $pageId): ?Page
    {
        return Page::with(['activeSections.registry', 'author', 'parent'])
            ->find($pageId);
    }

    /**
     * Duplicate a page.
     */
    public function duplicatePage(Page $page): Page
    {
        $newSlug = $this->generateUniqueSlug($page->title . ' (Copy)', $page->parent_id);

        $newPage = $page->replicate([
            'created_at',
            'updated_at',
            'published_at',
            'reviewed_at',
            'reviewed_by',
        ]);

        $newPage->title = $page->title . ' (Copy)';
        $newPage->slug = $newSlug;
        $newPage->full_slug = $page->parent_id
            ? trim($page->parent->full_slug, '/') . '/' . $newSlug
            : $newSlug;
        $newPage->status = Page::STATUS_DRAFT;
        $newPage->save();

        // Duplicate sections
        foreach ($page->sections as $section) {
            $newSection = $section->replicate(['created_at', 'updated_at']);
            $newSection->page_id = $newPage->id;
            $newSection->save();
        }

        return $newPage->fresh(['sections', 'parent']);
    }

    /**
     * Build hierarchical tree from flat collection.
     */
    protected function buildTree(Collection $pages, ?int $parentId = null): Collection
    {
        return $pages->where('parent_id', $parentId)
            ->map(function ($page) use ($pages) {
                $page->children_tree = $this->buildTree($pages, $page->id);
                return $page;
            })
            ->values();
    }
}
