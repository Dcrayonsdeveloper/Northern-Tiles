import { useState, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { StarRating, StarRatingInput, RatingSummary } from './StarRating';

// Verified badge icon
function VerifiedIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

// Single review card
function ReviewCard({ review, onHelpful }) {
    const [helpfulClicked, setHelpfulClicked] = useState(false);

    const handleHelpful = async (helpful) => {
        if (helpfulClicked) return;
        setHelpfulClicked(true);
        await onHelpful(review.id, helpful);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="border-b border-gray-200 py-6 last:border-0">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} size="sm" />
                        {review.verified_purchase && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                                <VerifiedIcon className="h-3.5 w-3.5" />
                                Verified Purchase
                            </span>
                        )}
                    </div>
                    {review.title && (
                        <h4 className="mt-2 font-semibold text-gray-900">{review.title}</h4>
                    )}
                </div>
                <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{review.reviewer_name}</span>
            </div>

            {review.body && (
                <p className="mt-3 text-sm text-gray-700 leading-relaxed">{review.body}</p>
            )}

            {/* Pros and Cons removed */}
            {false && (
                <div></div>
            )}

            {/* Admin reply */}
            {review.admin_reply && (
                <div className="mt-4 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-700">Seller Response:</p>
                    <p className="mt-1 text-sm text-gray-600">{review.admin_reply}</p>
                </div>
            )}

            {/* Helpful buttons */}
            <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="text-gray-500">Was this helpful?</span>
                <button
                    onClick={() => handleHelpful(true)}
                    disabled={helpfulClicked}
                    className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                    Yes ({review.helpful_count})
                </button>
                <button
                    onClick={() => handleHelpful(false)}
                    disabled={helpfulClicked}
                    className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                    No ({review.not_helpful_count})
                </button>
            </div>
        </div>
    );
}

// Review form
function ReviewForm({ productId, onSubmit, onCancel }) {
    const { auth } = usePage().props;
    const [form, setForm] = useState({
        rating: 0,
        title: '',
        body: '',
        reviewer_name: auth?.user?.name || '',
        reviewer_email: auth?.user?.email || '',
        pros: [''],
        cons: [''],
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.rating === 0) {
            setError('Please select a rating');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            const response = await fetch(`/api/reviews/products/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    ...form,
                    pros: form.pros.filter(p => p.trim()),
                    cons: form.cons.filter(c => c.trim()),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                onSubmit(data);
            } else {
                setError(data.error || 'Failed to submit review');
            }
        } catch (err) {
            setError('Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const updatePros = (index, value) => {
        const newPros = [...form.pros];
        newPros[index] = value;
        if (index === form.pros.length - 1 && value && form.pros.length < 5) {
            newPros.push('');
        }
        setForm({ ...form, pros: newPros });
    };

    const updateCons = (index, value) => {
        const newCons = [...form.cons];
        newCons[index] = value;
        if (index === form.cons.length - 1 && value && form.cons.length < 5) {
            newCons.push('');
        }
        setForm({ ...form, cons: newCons });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Rating */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Rating <span className="text-red-500">*</span>
                </label>
                <StarRatingInput
                    value={form.rating}
                    onChange={(rating) => setForm({ ...form, rating })}
                    size="lg"
                />
            </div>

            {/* Name */}
            {!auth?.user && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.reviewer_name}
                            onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })}
                            required
                            className="w-full rounded-lg border-gray-300 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email (optional)
                        </label>
                        <input
                            type="email"
                            value={form.reviewer_email}
                            onChange={(e) => setForm({ ...form, reviewer_email: e.target.value })}
                            className="w-full rounded-lg border-gray-300 text-sm"
                        />
                    </div>
                </div>
            )}

            {/* Title */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review Title
                </label>
                <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Sum up your experience"
                    className="w-full rounded-lg border-gray-300 text-sm"
                />
            </div>

            {/* Body */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Review
                </label>
                <textarea
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    rows={4}
                    placeholder="What did you like or dislike about this product?"
                    className="w-full rounded-lg border-gray-300 text-sm"
                />
            </div>

            {/* Pros/Cons removed */}

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

// Main reviews component
export default function ProductReviews({ productId }) {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [canReview, setCanReview] = useState({ can_review: true });
    const [sort, setSort] = useState('newest');
    const [filterRating, setFilterRating] = useState(null);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });

    const fetchReviews = useCallback(async (page = 1) => {
        try {
            const params = new URLSearchParams({
                page,
                sort,
                per_page: 10,
            });
            if (filterRating) params.append('rating', filterRating);

            const response = await fetch(`/api/reviews/products/${productId}?${params}`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin',
            });

            if (response.ok) {
                const data = await response.json();
                setReviews(data.reviews);
                setStats(data.stats);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
        } finally {
            setLoading(false);
        }
    }, [productId, sort, filterRating]);

    const checkCanReview = useCallback(async () => {
        try {
            const response = await fetch(`/api/reviews/products/${productId}/can-review`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin',
            });
            if (response.ok) {
                const data = await response.json();
                setCanReview(data);
            }
        } catch (err) {
            console.error('Failed to check review eligibility:', err);
        }
    }, [productId]);

    useEffect(() => {
        fetchReviews();
        checkCanReview();
    }, [fetchReviews, checkCanReview]);

    const handleHelpful = async (reviewId, helpful) => {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            await fetch(`/api/reviews/${reviewId}/helpful`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
                body: JSON.stringify({ helpful }),
            });
        } catch (err) {
            console.error('Failed to mark helpful:', err);
        }
    };

    const handleReviewSubmit = (data) => {
        setShowForm(false);
        if (data.review?.status === 'approved') {
            fetchReviews();
        }
        alert(data.message);
    };

    if (loading) {
        return (
            <div className="py-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            </div>
        );
    }

    return (
        <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

            {/* Rating summary */}
            {stats && stats.total > 0 && (
                <RatingSummary
                    average={stats.average}
                    total={stats.total}
                    distribution={stats.distribution}
                    className="mb-8"
                />
            )}

            {/* Write review button or form */}
            {!showForm && canReview.can_review && (
                <button
                    onClick={() => setShowForm(true)}
                    className="mb-6 px-6 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800"
                >
                    Write a Review
                </button>
            )}

            {!canReview.can_review && canReview.existing_review && (
                <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    You have already reviewed this product.
                </div>
            )}

            {showForm && (
                <div className="mb-8">
                    <ReviewForm
                        productId={productId}
                        onSubmit={handleReviewSubmit}
                        onCancel={() => setShowForm(false)}
                    />
                </div>
            )}

            {/* Filters */}
            {reviews.length > 0 && (
                <div className="flex items-center gap-4 mb-6">
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="rounded-lg border-gray-300 text-sm"
                    >
                        <option value="newest">Most Recent</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest">Highest Rated</option>
                        <option value="lowest">Lowest Rated</option>
                        <option value="helpful">Most Helpful</option>
                    </select>

                    <select
                        value={filterRating || ''}
                        onChange={(e) => setFilterRating(e.target.value || null)}
                        className="rounded-lg border-gray-300 text-sm"
                    >
                        <option value="">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>
                </div>
            )}

            {/* Reviews list */}
            {reviews.length > 0 ? (
                <div className="divide-y divide-gray-200">
                    {reviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            onHelpful={handleHelpful}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-8 text-center text-gray-500">
                    No reviews yet. Be the first to review this product!
                </div>
            )}

            {/* Pagination */}
            {pagination.last_page > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                    {[...Array(pagination.last_page)].map((_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => fetchReviews(i + 1)}
                            className={`px-3 py-1 rounded text-sm ${
                                pagination.current_page === i + 1
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
