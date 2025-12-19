<?php

namespace App\Domain\Catalog\Services;

use App\Domain\Catalog\Models\ProductReview;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ReviewService
{
    /**
     * Get paginated reviews for a product
     */
    public function getProductReviews(
        int $productId,
        int $perPage = 10,
        string $sort = 'newest',
        ?int $filterRating = null
    ): LengthAwarePaginator {
        $query = ProductReview::where('product_id', $productId)
            ->approved()
            ->with('user:id,name');

        if ($filterRating) {
            $query->where('rating', $filterRating);
        }

        switch ($sort) {
            case 'oldest':
                $query->oldest();
                break;
            case 'highest':
                $query->orderByDesc('rating');
                break;
            case 'lowest':
                $query->orderBy('rating');
                break;
            case 'helpful':
                $query->orderByDesc('helpful_count');
                break;
            case 'newest':
            default:
                $query->latest();
                break;
        }

        return $query->paginate($perPage);
    }

    /**
     * Get review statistics for a product
     */
    public function getProductReviewStats(int $productId): array
    {
        $stats = ProductReview::where('product_id', $productId)
            ->approved()
            ->selectRaw('
                COUNT(*) as total,
                AVG(rating) as average,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star,
                SUM(CASE WHEN verified_purchase = 1 THEN 1 ELSE 0 END) as verified_count
            ')
            ->first();

        $total = $stats->total ?? 0;

        return [
            'total' => $total,
            'average' => round($stats->average ?? 0, 1),
            'distribution' => [
                5 => ['count' => (int) ($stats->five_star ?? 0), 'percentage' => $total > 0 ? round(($stats->five_star / $total) * 100) : 0],
                4 => ['count' => (int) ($stats->four_star ?? 0), 'percentage' => $total > 0 ? round(($stats->four_star / $total) * 100) : 0],
                3 => ['count' => (int) ($stats->three_star ?? 0), 'percentage' => $total > 0 ? round(($stats->three_star / $total) * 100) : 0],
                2 => ['count' => (int) ($stats->two_star ?? 0), 'percentage' => $total > 0 ? round(($stats->two_star / $total) * 100) : 0],
                1 => ['count' => (int) ($stats->one_star ?? 0), 'percentage' => $total > 0 ? round(($stats->one_star / $total) * 100) : 0],
            ],
            'verified_count' => (int) ($stats->verified_count ?? 0),
        ];
    }

    /**
     * Create a new review
     */
    public function createReview(array $data): ProductReview
    {
        // Check if user has purchased the product
        $verifiedPurchase = false;
        $orderId = null;

        if (!empty($data['user_id'])) {
            $order = Order::where('user_id', $data['user_id'])
                ->whereHas('items', fn($q) => $q->where('product_id', $data['product_id']))
                ->where('status', 'completed')
                ->first();

            if ($order) {
                $verifiedPurchase = true;
                $orderId = $order->id;
            }
        }

        $review = ProductReview::create([
            'product_id' => $data['product_id'],
            'user_id' => $data['user_id'] ?? null,
            'order_id' => $orderId,
            'reviewer_name' => $data['reviewer_name'],
            'reviewer_email' => $data['reviewer_email'] ?? null,
            'rating' => $data['rating'],
            'title' => $data['title'] ?? null,
            'body' => $data['body'] ?? null,
            'pros' => $data['pros'] ?? null,
            'cons' => $data['cons'] ?? null,
            'verified_purchase' => $verifiedPurchase,
            'status' => $this->shouldAutoApprove($data) ? 'approved' : 'pending',
        ]);

        // Update product rating cache if auto-approved
        if ($review->status === 'approved') {
            $review->product->updateRatingCache();
        }

        return $review;
    }

    /**
     * Check if user can review a product
     */
    public function canUserReview(int $productId, ?int $userId, ?string $email): array
    {
        // Check for existing review
        $existingReview = ProductReview::where('product_id', $productId)
            ->where(function ($q) use ($userId, $email) {
                if ($userId) {
                    $q->where('user_id', $userId);
                }
                if ($email) {
                    $q->orWhere('reviewer_email', $email);
                }
            })
            ->first();

        if ($existingReview) {
            return [
                'can_review' => false,
                'reason' => 'You have already reviewed this product.',
                'existing_review' => $existingReview,
            ];
        }

        // Check if user purchased the product
        $hasPurchased = false;
        if ($userId) {
            $hasPurchased = Order::where('user_id', $userId)
                ->whereHas('items', fn($q) => $q->where('product_id', $productId))
                ->where('status', 'completed')
                ->exists();
        }

        return [
            'can_review' => true,
            'has_purchased' => $hasPurchased,
            'existing_review' => null,
        ];
    }

    /**
     * Mark review as helpful
     */
    public function markHelpful(int $reviewId, bool $helpful): void
    {
        $review = ProductReview::findOrFail($reviewId);

        if ($helpful) {
            $review->markHelpful();
        } else {
            $review->markNotHelpful();
        }
    }

    /**
     * Get featured reviews for a product
     */
    public function getFeaturedReviews(int $productId, int $limit = 3): \Illuminate\Database\Eloquent\Collection
    {
        return ProductReview::where('product_id', $productId)
            ->approved()
            ->where(function ($q) {
                $q->where('is_featured', true)
                    ->orWhere('verified_purchase', true);
            })
            ->orderByDesc('is_featured')
            ->orderByDesc('helpful_count')
            ->orderByDesc('rating')
            ->limit($limit)
            ->get();
    }

    /**
     * Determine if review should be auto-approved
     */
    protected function shouldAutoApprove(array $data): bool
    {
        // Auto-approve all reviews for better user experience
        // Reviews can still be moderated/removed from admin if needed
        return true;
    }
}
