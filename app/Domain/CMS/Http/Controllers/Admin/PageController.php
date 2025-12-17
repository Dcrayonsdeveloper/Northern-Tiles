<?php

namespace App\Domain\CMS\Http\Controllers\Admin;

use App\Domain\CMS\Http\Requests\StorePageRequest;
use App\Domain\CMS\Http\Requests\UpdatePageRequest;
use App\Domain\CMS\Models\Author;
use App\Domain\CMS\Models\Page;
use App\Domain\CMS\Services\PageService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function __construct(
        protected PageService $pageService
    ) {}

    public function index(Request $request): Response
    {
        $query = Page::with(['author', 'parent', 'children'])
            ->withCount('children');

        // Filter by status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Search by title or slug
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('full_slug', 'like', "%{$search}%");
            });
        }

        // Filter by parent
        if ($request->has('parent_id')) {
            $parentId = $request->input('parent_id');
            if ($parentId === 'root') {
                $query->whereNull('parent_id');
            } else {
                $query->where('parent_id', $parentId);
            }
        }

        $pages = $query->orderBy('sort')
            ->orderBy('title')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Cms/Pages/Index', [
            'pages' => $pages,
            'filters' => $request->only(['status', 'search', 'parent_id']),
            'statuses' => Page::STATUSES,
            'parentOptions' => $this->pageService->getPagesForParentSelect(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Cms/Pages/Edit', [
            'page' => null,
            'authors' => Author::active()->orderBy('name')->get(['id', 'name']),
            'templates' => $this->getTemplates(),
            'parentOptions' => $this->pageService->getPagesForParentSelect(),
            'statuses' => Page::STATUSES,
            'availableSections' => $this->pageService->getAvailableSections(),
        ]);
    }

    public function store(StorePageRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Handle featured image upload
        if ($request->hasFile('featured_image_file')) {
            $data['featured_image'] = $request->file('featured_image_file')
                ->store('pages/featured', 'public');
        }

        // Handle OG image upload
        if ($request->hasFile('og_image_file')) {
            $data['og_image'] = $request->file('og_image_file')
                ->store('pages/og', 'public');
        }

        $sections = $data['sections'] ?? [];
        unset($data['sections'], $data['featured_image_file'], $data['og_image_file']);

        $page = $this->pageService->createPage($data, $sections);

        return redirect()->route('admin.cms.pages.edit', $page)
            ->with('success', 'Page created successfully');
    }

    public function edit(Page $page): Response
    {
        $page->load(['author', 'parent', 'sections.registry']);

        return Inertia::render('Admin/Cms/Pages/Edit', [
            'page' => $page,
            'authors' => Author::active()->orderBy('name')->get(['id', 'name']),
            'templates' => $this->getTemplates(),
            'parentOptions' => $this->pageService->getPagesForParentSelect($page->id),
            'statuses' => Page::STATUSES,
            'availableSections' => $this->pageService->getAvailableSections(),
        ]);
    }

    public function update(UpdatePageRequest $request, Page $page): RedirectResponse
    {
        $data = $request->validated();

        // Handle featured image upload
        if ($request->hasFile('featured_image_file')) {
            // Delete old image
            if ($page->featured_image) {
                Storage::disk('public')->delete($page->featured_image);
            }
            $data['featured_image'] = $request->file('featured_image_file')
                ->store('pages/featured', 'public');
        }

        // Handle featured image removal
        if ($request->boolean('remove_featured_image') && $page->featured_image) {
            Storage::disk('public')->delete($page->featured_image);
            $data['featured_image'] = null;
        }

        // Handle OG image upload
        if ($request->hasFile('og_image_file')) {
            if ($page->og_image) {
                Storage::disk('public')->delete($page->og_image);
            }
            $data['og_image'] = $request->file('og_image_file')
                ->store('pages/og', 'public');
        }

        // Handle OG image removal
        if ($request->boolean('remove_og_image') && $page->og_image) {
            Storage::disk('public')->delete($page->og_image);
            $data['og_image'] = null;
        }

        $sections = $data['sections'] ?? [];
        unset($data['sections'], $data['featured_image_file'], $data['og_image_file'],
            $data['remove_featured_image'], $data['remove_og_image']);

        $this->pageService->updatePage($page, $data, $sections);

        return back()->with('success', 'Page updated successfully');
    }

    public function destroy(Page $page): RedirectResponse
    {
        // Check if page has children
        if ($page->hasChildren()) {
            return back()->with('error', 'Cannot delete a page that has child pages. Move or delete children first.');
        }

        // Delete associated images
        if ($page->featured_image) {
            Storage::disk('public')->delete($page->featured_image);
        }
        if ($page->og_image) {
            Storage::disk('public')->delete($page->og_image);
        }

        $page->delete();

        return redirect()->route('admin.cms.pages.index')
            ->with('success', 'Page moved to trash');
    }

    public function restore(int $id): RedirectResponse
    {
        $page = Page::withTrashed()->findOrFail($id);
        $page->restore();

        return back()->with('success', 'Page restored successfully');
    }

    public function forceDelete(int $id): RedirectResponse
    {
        $page = Page::withTrashed()->findOrFail($id);

        if ($page->featured_image) {
            Storage::disk('public')->delete($page->featured_image);
        }
        if ($page->og_image) {
            Storage::disk('public')->delete($page->og_image);
        }

        $page->sections()->delete();
        $page->forceDelete();

        return redirect()->route('admin.cms.pages.index')
            ->with('success', 'Page permanently deleted');
    }

    public function duplicate(Page $page): RedirectResponse
    {
        $newPage = $this->pageService->duplicatePage($page);

        return redirect()->route('admin.cms.pages.edit', $newPage)
            ->with('success', 'Page duplicated successfully');
    }

    public function publish(Page $page): RedirectResponse
    {
        $this->authorize('publish', $page);

        $page->publish();

        return back()->with('success', 'Page published successfully');
    }

    public function unpublish(Page $page): RedirectResponse
    {
        $this->authorize('publish', $page);

        $page->unpublish();

        return back()->with('success', 'Page unpublished successfully');
    }

    public function archive(Page $page): RedirectResponse
    {
        $page->archive();

        return back()->with('success', 'Page archived successfully');
    }

    public function generateSlug(Request $request): array
    {
        $title = $request->input('title', '');
        $parentId = $request->input('parent_id');
        $excludeId = $request->input('exclude_id');

        $slug = $this->pageService->generateUniqueSlug($title, $parentId, $excludeId);

        // Build full slug preview
        $fullSlug = $slug;
        if ($parentId) {
            $parent = Page::find($parentId);
            if ($parent) {
                $fullSlug = trim($parent->full_slug, '/') . '/' . $slug;
            }
        }

        return [
            'slug' => $slug,
            'full_slug' => $fullSlug,
        ];
    }

    protected function getTemplates(): array
    {
        return [
            ['key' => 'default', 'label' => 'Default Template'],
            ['key' => 'full_width', 'label' => 'Full Width'],
            ['key' => 'sidebar_left', 'label' => 'Sidebar Left'],
            ['key' => 'sidebar_right', 'label' => 'Sidebar Right'],
            ['key' => 'contact', 'label' => 'Contact Page'],
            ['key' => 'about', 'label' => 'About Page'],
            ['key' => 'landing', 'label' => 'Landing Page'],
        ];
    }
}
