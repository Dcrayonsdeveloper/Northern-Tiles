<?php

namespace App\Domain\CMS\Http\Controllers\Admin;

use App\Domain\CMS\Http\Requests\StorePageRequest;
use App\Domain\CMS\Http\Requests\UpdatePageRequest;
use App\Domain\CMS\Models\Author;
use App\Domain\CMS\Models\Page;
use App\Domain\CMS\Services\CMSService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function __construct(
        protected CMSService $cmsService
    ) {}

    public function index(Request $request): Response
    {
        $pages = Page::with('author')
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('search'), fn ($q, $search) => $q->where('title', 'like', "%{$search}%"))
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Admin/Pages/Index', [
            'pages' => $pages,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function create(): Response
    {
        $authors = Author::active()->orderBy('name')->get();

        return Inertia::render('Admin/Pages/Create', [
            'authors' => $authors,
            'templates' => $this->getTemplates(),
        ]);
    }

    public function store(StorePageRequest $request)
    {
        $this->cmsService->createPage($request->validated());

        return redirect()->route('admin.pages.index')
            ->with('success', 'Page created successfully');
    }

    public function edit(Page $page): Response
    {
        $page->load('author');
        $authors = Author::active()->orderBy('name')->get();

        return Inertia::render('Admin/Pages/Edit', [
            'page' => $page,
            'authors' => $authors,
            'templates' => $this->getTemplates(),
        ]);
    }

    public function update(UpdatePageRequest $request, Page $page)
    {
        $this->cmsService->updatePage($page, $request->validated());

        return redirect()->route('admin.pages.index')
            ->with('success', 'Page updated successfully');
    }

    public function destroy(Page $page)
    {
        $page->delete();

        return redirect()->route('admin.pages.index')
            ->with('success', 'Page deleted successfully');
    }

    public function publish(Page $page)
    {
        $this->authorize('publish', $page);

        $this->cmsService->publishPage($page);

        return back()->with('success', 'Page published successfully');
    }

    public function unpublish(Page $page)
    {
        $this->authorize('publish', $page);

        $page->unpublish();

        return back()->with('success', 'Page unpublished successfully');
    }

    protected function getTemplates(): array
    {
        return [
            'default' => 'Default Template',
            'full_width' => 'Full Width',
            'sidebar_left' => 'Sidebar Left',
            'sidebar_right' => 'Sidebar Right',
            'contact' => 'Contact Page',
            'about' => 'About Page',
        ];
    }
}
