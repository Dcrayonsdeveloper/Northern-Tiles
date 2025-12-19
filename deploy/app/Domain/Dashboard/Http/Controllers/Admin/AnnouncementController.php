<?php

namespace App\Domain\Dashboard\Http\Controllers\Admin;

use App\Domain\Dashboard\Http\Requests\Admin\AnnouncementRequest;
use App\Domain\Dashboard\Models\Announcement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController
{
    public function index(Request $request): Response
    {
        $items = Announcement::query()
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Announcements/Index', [
            'items' => $items,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Announcements/Create');
    }

    public function store(AnnouncementRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        Announcement::query()->create($validated);

        return redirect()->route('admin.announcements.index')->with('success', 'Announcement created.');
    }

    public function edit(Announcement $announcement): Response
    {
        return Inertia::render('Admin/Announcements/Edit', [
            'announcement' => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'body_html' => $announcement->body_html,
                'audience' => $announcement->audience,
                'starts_at' => $announcement->starts_at?->format('Y-m-d\\TH:i'),
                'ends_at' => $announcement->ends_at?->format('Y-m-d\\TH:i'),
                'is_active' => (bool) $announcement->is_active,
            ],
        ]);
    }

    public function update(AnnouncementRequest $request, Announcement $announcement): RedirectResponse
    {
        $validated = $request->validated();

        $announcement->update($validated);

        return redirect()->route('admin.announcements.index')->with('success', 'Announcement updated.');
    }

    public function destroy(Announcement $announcement): RedirectResponse
    {
        $announcement->delete();

        return redirect()->route('admin.announcements.index')->with('success', 'Announcement deleted.');
    }
}
