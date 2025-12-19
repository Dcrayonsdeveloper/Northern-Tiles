<?php

namespace App\Http\Controllers\Api;

use App\Domain\Catalog\Services\ReviewService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function __construct(
        protected ReviewService $reviewService
    ) {}

    /**
     * Get reviews for a product
     */
    public function index(Request $request, int $productId): JsonResponse
    {
        $reviews = $this->reviewService->getProductReviews(
            $productId,
            $request->input('per_page', 10),
            $request->input('sort', 'newest'),
            $request->input('rating')
        );

        $stats = $this->reviewService->getProductReviewStats($productId);

        return response()->json([
            'reviews' => $reviews->items(),
            'stats' => $stats,
            'pagination' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    /**
     * Get review statistics for a product
     */
    public function stats(int $productId): JsonResponse
    {
        $stats = $this->reviewService->getProductReviewStats($productId);

        return response()->json($stats);
    }

    /**
     * Submit a new review
     */
    public function store(Request $request, int $productId): JsonResponse
    {
        $validated = $request->validate([
            'reviewer_name' => ['required', 'string', 'max:100'],
            'reviewer_email' => ['nullable', 'email', 'max:255'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:200'],
            'body' => ['nullable', 'string', 'max:5000'],
            'pros' => ['nullable', 'array', 'max:5'],
            'pros.*' => ['string', 'max:100'],
            'cons' => ['nullable', 'array', 'max:5'],
            'cons.*' => ['string', 'max:100'],
        ]);

        $userId = $request->user()?->id;
        $email = $validated['reviewer_email'] ?? $request->user()?->email;

        // Check if user can review
        $canReview = $this->reviewService->canUserReview($productId, $userId, $email);

        if (!$canReview['can_review']) {
            return response()->json([
                'success' => false,
                'error' => $canReview['reason'],
            ], 422);
        }

        $review = $this->reviewService->createReview([
            'product_id' => $productId,
            'user_id' => $userId,
            'reviewer_name' => $validated['reviewer_name'],
            'reviewer_email' => $email,
            'rating' => $validated['rating'],
            'title' => $validated['title'] ?? null,
            'body' => $validated['body'] ?? null,
            'pros' => $validated['pros'] ?? null,
            'cons' => $validated['cons'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => $review->status === 'approved'
                ? 'Thank you for your review!'
                : 'Thank you! Your review has been submitted and is pending approval.',
            'review' => $review,
        ], 201);
    }

    /**
     * Mark a review as helpful or not helpful
     */
    public function markHelpful(Request $request, int $reviewId): JsonResponse
    {
        $validated = $request->validate([
            'helpful' => ['required', 'boolean'],
        ]);

        $this->reviewService->markHelpful($reviewId, $validated['helpful']);

        return response()->json(['success' => true]);
    }

    /**
     * Check if user can review a product
     */
    public function canReview(Request $request, int $productId): JsonResponse
    {
        $userId = $request->user()?->id;
        $email = $request->input('email') ?? $request->user()?->email;

        $result = $this->reviewService->canUserReview($productId, $userId, $email);

        return response()->json($result);
    }
}
