<?php

namespace App\Domain\SEO\Http\Controllers\Admin;

use App\Domain\SEO\Http\Requests\StoreRedirectRequest;
use App\Domain\SEO\Http\Requests\UpdateSeoMetaRequest;
use App\Domain\SEO\Jobs\GenerateSitemapJob;
use App\Domain\SEO\Models\NotFoundLog;
use App\Domain\SEO\Models\Redirect;
use App\Domain\SEO\Models\SeoMeta;
use App\Domain\SEO\Services\SeoService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SeoController extends Controller
{
    public function __construct(
        protected SeoService $seoService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/SeoMeta/Index', [
            'stats' => [
                'total_redirects' => Redirect::count(),
                'active_redirects' => Redirect::active()->count(),
                'unresolved_404s' => NotFoundLog::unresolved()->count(),
            ],
        ]);
    }

    public function redirects(Request $request): Response
    {
        $redirects = Redirect::query()
            ->when($request->input('search'), fn ($q, $search) => $q->where('from_path', 'like', "%{$search}%"))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Admin/Redirects/Index', [
            'redirects' => $redirects,
            'statusCodes' => Redirect::getStatusCodes(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function storeRedirect(StoreRedirectRequest $request)
    {
        Redirect::create($request->validated());

        return back()->with('success', 'Redirect created successfully');
    }

    public function updateRedirect(Request $request, Redirect $redirect)
    {
        $validated = $request->validate([
            'from_path' => 'required|string|max:500',
            'to_path' => 'required|string|max:500',
            'status_code' => 'nullable|in:301,302,307,308',
            'is_active' => 'nullable|boolean',
            'is_regex' => 'nullable|boolean',
        ]);

        $redirect->update($validated);

        return back()->with('success', 'Redirect updated successfully');
    }

    public function destroyRedirect(Redirect $redirect)
    {
        $redirect->delete();

        return back()->with('success', 'Redirect deleted successfully');
    }

    public function notFoundLogs(Request $request): Response
    {
        $logs = NotFoundLog::query()
            ->when($request->input('resolved'), function ($q, $resolved) {
                $q->where('is_resolved', $resolved === 'true');
            })
            ->when($request->input('search'), fn ($q, $search) => $q->where('path', 'like', "%{$search}%"))
            ->orderBy('hit_count', 'desc')
            ->paginate(20);

        return Inertia::render('Admin/NotFoundLogs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['resolved', 'search']),
        ]);
    }

    public function resolve404(NotFoundLog $log, Request $request)
    {
        $validated = $request->validate([
            'to_path' => 'required|string|max:500',
            'status_code' => 'nullable|in:301,302,307,308',
        ]);

        $log->createRedirect($validated['to_path'], $validated['status_code'] ?? 301);

        return back()->with('success', '404 resolved with redirect');
    }

    public function generateSitemap()
    {
        GenerateSitemapJob::dispatch();

        return back()->with('success', 'Sitemap generation started');
    }

    public function robots(): Response
    {
        $content = $this->seoService->getRobotsTxt();

        return Inertia::render('Admin/Settings/Robots', [
            'content' => $content,
        ]);
    }

    public function updateRobots(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $this->seoService->saveRobotsTxt($validated['content']);

        return back()->with('success', 'robots.txt updated successfully');
    }

    public function updateMeta(UpdateSeoMetaRequest $request)
    {
        $data = $request->validated();

        SeoMeta::updateFor($data['model_type'], $data['model_id'], $data);

        return back()->with('success', 'SEO meta updated successfully');
    }
}
