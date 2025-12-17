<?php

namespace App\Domain\CMS\Http\Controllers\Admin;

use App\Domain\CMS\Models\Author;
use App\Domain\CMS\Services\CMSService;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AuthorController extends Controller
{
    public function __construct(
        protected CMSService $cmsService
    ) {}

    public function index(): Response
    {
        $authors = Author::withCount('posts')
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('Admin/Authors/Index', [
            'authors' => $authors,
        ]);
    }

    public function create(): Response
    {
        $users = User::whereDoesntHave('author')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('Admin/Authors/Create', [
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id|unique:authors,user_id',
            'name' => 'required|string|max:191',
            'slug' => 'nullable|string|max:191|unique:authors,slug',
            'bio' => 'nullable|string',
            'avatar' => 'nullable|image|max:2048',
            'job_title' => 'nullable|string|max:100',
            'social' => 'nullable|array',
            'social.twitter' => 'nullable|url',
            'social.linkedin' => 'nullable|url',
            'social.website' => 'nullable|url',
            'is_active' => 'nullable|boolean',
        ]);

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('authors', 'public');
        }

        Author::create([
            'user_id' => $validated['user_id'] ?? null,
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'bio_json' => ['content' => $validated['bio'] ?? null],
            'avatar_file' => $avatarPath,
            'job_title' => $validated['job_title'] ?? null,
            'social_json' => $validated['social'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('admin.authors.index')
            ->with('success', 'Author created successfully');
    }

    public function edit(Author $author): Response
    {
        $users = User::whereDoesntHave('author')
            ->orWhere('id', $author->user_id)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('Admin/Authors/Edit', [
            'author' => $author,
            'users' => $users,
        ]);
    }

    public function update(Request $request, Author $author)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id|unique:authors,user_id,' . $author->id,
            'name' => 'required|string|max:191',
            'slug' => 'nullable|string|max:191|unique:authors,slug,' . $author->id,
            'bio' => 'nullable|string',
            'avatar' => 'nullable|image|max:2048',
            'job_title' => 'nullable|string|max:100',
            'social' => 'nullable|array',
            'social.twitter' => 'nullable|url',
            'social.linkedin' => 'nullable|url',
            'social.website' => 'nullable|url',
            'is_active' => 'nullable|boolean',
        ]);

        $avatarPath = $author->avatar_file;
        if ($request->hasFile('avatar')) {
            if ($avatarPath) {
                Storage::disk('public')->delete($avatarPath);
            }
            $avatarPath = $request->file('avatar')->store('authors', 'public');
        }

        $author->update([
            'user_id' => $validated['user_id'] ?? null,
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'bio_json' => ['content' => $validated['bio'] ?? null],
            'avatar_file' => $avatarPath,
            'job_title' => $validated['job_title'] ?? null,
            'social_json' => $validated['social'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $this->cmsService->flushAuthorCache($author->slug);

        return redirect()->route('admin.authors.index')
            ->with('success', 'Author updated successfully');
    }

    public function destroy(Author $author)
    {
        if ($author->posts()->count() > 0) {
            return back()->with('error', 'Cannot delete author with existing posts');
        }

        if ($author->avatar_file) {
            Storage::disk('public')->delete($author->avatar_file);
        }

        $author->delete();

        return redirect()->route('admin.authors.index')
            ->with('success', 'Author deleted successfully');
    }
}
