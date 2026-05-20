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
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SeoController extends Controller
{
    public function __construct(
        protected SeoService $seoService
    ) {}

    public function index(Request $request): Response
    {
        $query = SeoMeta::whereNotNull('url_path')
            ->when($request->input('search'), fn ($q, $s) => $q->where('url_path', 'like', "%{$s}%"))
            ->orderBy('created_at', 'desc');

        $all = SeoMeta::whereNotNull('url_path')->get();

        $avgScore = (int) round($all->avg(function ($m) {
            $score = 0;
            $title = $m->meta_title ?? '';
            $desc = $m->meta_description ?? '';
            $titleLen = strlen($title);
            if ($title && $titleLen >= 30 && $titleLen <= 60) $score += 25;
            elseif ($title) $score += 10;
            $descLen = strlen($desc);
            if ($desc && $descLen >= 120 && $descLen <= 160) $score += 25;
            elseif ($desc) $score += 10;
            if ($m->og_title && $m->og_image) $score += 25;
            elseif ($m->og_title || $m->og_image) $score += 10;
            if (!empty($m->schema_json)) $score += 25;
            return $score;
        }) ?? 0);

        return Inertia::render('Admin/SeoMeta/Index', [
            'seoMeta' => $query->paginate(20),
            'stats' => [
                'total' => $all->count(),
                'avg_score' => $avgScore,
                'with_schema' => $all->filter(fn ($m) => !empty($m->schema_json))->count(),
                'noindex' => $all->where('noindex', true)->count(),
            ],
            'filters' => $request->only(['search']),
        ]);
    }

    public function storeMeta(Request $request)
    {
        $validated = $request->validate([
            'url_path' => ['required', 'string', 'max:500', Rule::unique('seo_meta', 'url_path')],
            'meta_title' => 'nullable|string|max:191',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string',
            'og_title' => 'nullable|string|max:191',
            'og_description' => 'nullable|string',
            'og_image' => 'nullable|string|max:500',
            'canonical_url' => 'nullable|string|max:500',
            'robots' => 'nullable|string',
            'schema_markup' => 'nullable|string',
        ]);

        $data = $this->normalizeSeoData($validated);
        SeoMeta::create($data);

        return back()->with('success', 'SEO override created successfully');
    }

    public function updateMetaById(Request $request, SeoMeta $seoMeta)
    {
        $validated = $request->validate([
            'meta_title' => 'nullable|string|max:191',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string',
            'og_title' => 'nullable|string|max:191',
            'og_description' => 'nullable|string',
            'og_image' => 'nullable|string|max:500',
            'canonical_url' => 'nullable|string|max:500',
            'robots' => 'nullable|string',
            'schema_markup' => 'nullable|string',
        ]);

        $data = $this->normalizeSeoData($validated);
        $seoMeta->update($data);

        return back()->with('success', 'SEO override updated successfully');
    }

    public function destroyMeta(SeoMeta $seoMeta)
    {
        $seoMeta->delete();

        return back()->with('success', 'SEO override deleted successfully');
    }

    private function normalizeSeoData(array $data): array
    {
        if (array_key_exists('robots', $data)) {
            $robots = $data['robots'] ?? 'index, follow';
            $data['noindex'] = str_contains($robots, 'noindex');
            $data['nofollow'] = str_contains($robots, 'nofollow');
            unset($data['robots']);
        }

        if (array_key_exists('schema_markup', $data)) {
            $schema = trim($data['schema_markup'] ?? '');
            if ($schema !== '') {
                $decoded = json_decode($schema, true);
                $data['schema_json'] = json_last_error() === JSON_ERROR_NONE ? $decoded : null;
            } else {
                $data['schema_json'] = null;
            }
            unset($data['schema_markup']);
        }

        return $data;
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
            ->when($request->input('search'), fn ($q, $search) => $q->where('path', 'like', "%{$search}%"))
            ->orderBy('hit_count', 'desc')
            ->paginate(20);

        $stats = [
            'today' => NotFoundLog::whereDate('created_at', today())->count(),
            'week' => NotFoundLog::where('created_at', '>=', now()->subDays(7))->count(),
            'unique_urls' => NotFoundLog::distinct('path')->count('path'),
            'top_referrer' => NotFoundLog::whereNotNull('referer')
                ->select('referer')
                ->groupBy('referer')
                ->orderByRaw('COUNT(*) DESC')
                ->value('referer'),
        ];

        return Inertia::render('Admin/NotFoundLogs/Index', [
            'logs' => $logs,
            'statusCodes' => Redirect::getStatusCodes(),
            'filters' => $request->only(['search']),
            'stats' => $stats,
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

    public function clearNotFoundLogs()
    {
        NotFoundLog::truncate();

        return back()->with('success', 'All 404 logs cleared');
    }

    public function ignoreNotFoundLog(NotFoundLog $log)
    {
        $log->update(['is_ignored' => true]);

        return back()->with('success', 'Log entry ignored');
    }

    public function destroyNotFoundLog(NotFoundLog $log)
    {
        $log->delete();

        return back()->with('success', 'Log entry deleted');
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
