<?php

namespace App\Domain\Catalog\Http\Controllers\Admin;

use App\Domain\Catalog\Models\ProductReview;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ProductReview::query()
            ->with(['product:id,name,slug,image_url', 'user:id,name,email'])
            ->latest();

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reviewer_name', 'like', "%{$search}%")
                    ->orWhere('reviewer_email', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%")
                    ->orWhereHas('product', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Filter by rating
        if ($rating = $request->input('rating')) {
            $query->where('rating', $rating);
        }

        // Filter by verified purchase
        if ($request->has('verified')) {
            $query->where('verified_purchase', $request->boolean('verified'));
        }

        // Filter by product
        if ($productId = $request->input('product_id')) {
            $query->where('product_id', $productId);
        }

        $reviews = $query->paginate(20)->withQueryString();

        // Get stats
        $stats = [
            'total' => ProductReview::count(),
            'pending' => ProductReview::where('status', 'pending')->count(),
            'approved' => ProductReview::where('status', 'approved')->count(),
            'rejected' => ProductReview::where('status', 'rejected')->count(),
            'average_rating' => round(ProductReview::where('status', 'approved')->avg('rating') ?? 0, 1),
        ];

        return Inertia::render('Admin/Reviews/Index', [
            'reviews' => $reviews,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'rating', 'verified', 'product_id']),
        ]);
    }

    public function show(ProductReview $review): Response
    {
        $review->load(['product', 'user', 'order']);

        // Get other reviews from same customer
        $customerReviews = ProductReview::where('id', '!=', $review->id)
            ->where(function ($q) use ($review) {
                if ($review->user_id) {
                    $q->where('user_id', $review->user_id);
                } elseif ($review->reviewer_email) {
                    $q->where('reviewer_email', $review->reviewer_email);
                }
            })
            ->with('product:id,name,slug')
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Admin/Reviews/Show', [
            'review' => $review,
            'customerReviews' => $customerReviews,
        ]);
    }

    public function approve(ProductReview $review): RedirectResponse
    {
        $review->update(['status' => 'approved']);
        $review->product->updateRatingCache();

        return back()->with('success', 'Review approved successfully.');
    }

    public function reject(ProductReview $review): RedirectResponse
    {
        $review->update(['status' => 'rejected']);
        $review->product->updateRatingCache();

        return back()->with('success', 'Review rejected.');
    }

    public function reply(Request $request, ProductReview $review): RedirectResponse
    {
        $validated = $request->validate([
            'admin_reply' => ['required', 'string', 'max:2000'],
        ]);

        $review->update([
            'admin_reply' => $validated['admin_reply'],
            'admin_replied_at' => now(),
        ]);

        return back()->with('success', 'Reply added successfully.');
    }

    public function removeReply(ProductReview $review): RedirectResponse
    {
        $review->update([
            'admin_reply' => null,
            'admin_replied_at' => null,
        ]);

        return back()->with('success', 'Reply removed.');
    }

    public function toggleFeatured(ProductReview $review): RedirectResponse
    {
        $review->update(['is_featured' => !$review->is_featured]);

        return back()->with('success', 'Review featured status updated.');
    }

    public function destroy(ProductReview $review): RedirectResponse
    {
        $product = $review->product;
        $review->delete();
        $product->updateRatingCache();

        return redirect()
            ->route('admin.reviews.index')
            ->with('success', 'Review deleted successfully.');
    }

    public function bulkApprove(Request $request): RedirectResponse
    {
        $ids = $request->input('ids', []);

        ProductReview::whereIn('id', $ids)->update(['status' => 'approved']);

        // Update rating cache for affected products
        $productIds = ProductReview::whereIn('id', $ids)->pluck('product_id')->unique();
        foreach ($productIds as $productId) {
            Product::find($productId)?->updateRatingCache();
        }

        return back()->with('success', count($ids) . ' reviews approved.');
    }

    public function bulkReject(Request $request): RedirectResponse
    {
        $ids = $request->input('ids', []);

        ProductReview::whereIn('id', $ids)->update(['status' => 'rejected']);

        // Update rating cache for affected products
        $productIds = ProductReview::whereIn('id', $ids)->pluck('product_id')->unique();
        foreach ($productIds as $productId) {
            Product::find($productId)?->updateRatingCache();
        }

        return back()->with('success', count($ids) . ' reviews rejected.');
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        $ids = $request->input('ids', []);

        // Get product IDs before deletion
        $productIds = ProductReview::whereIn('id', $ids)->pluck('product_id')->unique();

        ProductReview::whereIn('id', $ids)->delete();

        // Update rating cache for affected products
        foreach ($productIds as $productId) {
            Product::find($productId)?->updateRatingCache();
        }

        return back()->with('success', count($ids) . ' reviews deleted.');
    }
}
