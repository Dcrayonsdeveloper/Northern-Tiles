<?php

namespace App\Domain\CMS\Http\Controllers\Admin;

use App\Domain\CMS\Http\Requests\StorePostRequest;
use App\Domain\CMS\Http\Requests\UpdatePostRequest;
use App\Domain\CMS\Models\Author;
use App\Domain\CMS\Models\Post;
use App\Domain\CMS\Models\PostCategory;
use App\Domain\CMS\Services\CMSService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    public function __construct(
        protected CMSService $cmsService
    ) {}

    public function index(Request $request): Response
    {
        $posts = Post::with(['author', 'category'])
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('category_id'), fn ($q, $id) => $q->where('category_id', $id))
            ->when($request->input('search'), fn ($q, $search) => $q->where('title', 'like', "%{$search}%"))
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        $categories = PostCategory::orderBy('name')->get();

        return Inertia::render('Admin/Posts/Index', [
            'posts' => $posts,
            'categories' => $categories,
            'filters' => $request->only(['status', 'category_id', 'search']),
        ]);
    }

    public function create(): Response
    {
        $authors = Author::active()->orderBy('name')->get();
        $categories = PostCategory::orderBy('name')->get();

        return Inertia::render('Admin/Posts/Create', [
            'authors' => $authors,
            'categories' => $categories,
        ]);
    }

    public function store(StorePostRequest $request)
    {
        $this->cmsService->createPost($request->validated());

        return redirect()->route('admin.posts.index')
            ->with('success', 'Post created successfully');
    }

    public function edit(Post $post): Response
    {
        $post->load(['author', 'category', 'tags']);
        $authors = Author::active()->orderBy('name')->get();
        $categories = PostCategory::orderBy('name')->get();

        return Inertia::render('Admin/Posts/Edit', [
            'post' => $post,
            'authors' => $authors,
            'categories' => $categories,
            'selectedTags' => $post->tags->pluck('name'),
        ]);
    }

    public function update(UpdatePostRequest $request, Post $post)
    {
        $this->cmsService->updatePost($post, $request->validated());

        return redirect()->route('admin.posts.index')
            ->with('success', 'Post updated successfully');
    }

    public function destroy(Post $post)
    {
        $post->delete();

        return redirect()->route('admin.posts.index')
            ->with('success', 'Post deleted successfully');
    }

    public function publish(Post $post)
    {
        $this->authorize('publish', $post);

        $this->cmsService->publishPost($post);

        return back()->with('success', 'Post published successfully');
    }

    public function unpublish(Post $post)
    {
        $this->authorize('publish', $post);

        $post->unpublish();

        return back()->with('success', 'Post unpublished successfully');
    }
}
