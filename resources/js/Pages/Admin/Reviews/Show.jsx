import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';

function ArrowLeftIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
    );
}

function StarIcon({ className, filled }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );
}

function StarRating({ rating, size = 'md' }) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
    };
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                    key={star}
                    className={`${sizeClasses[size]} ${star <= rating ? 'text-amber-400' : 'text-gray-300'}`}
                    filled={star <= rating}
                />
            ))}
        </div>
    );
}

function StatusBadge({ status }) {
    const colors = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };

    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${colors[status]}`}>
            {status}
        </span>
    );
}

export default function Show({ review, customerReviews }) {
    const { data, setData, post, processing } = useForm({
        admin_reply: review.admin_reply || '',
    });

    const handleApprove = () => {
        router.post(route('admin.reviews.approve', review.id));
    };

    const handleReject = () => {
        router.post(route('admin.reviews.reject', review.id));
    };

    const handleToggleFeatured = () => {
        router.post(route('admin.reviews.toggle-featured', review.id));
    };

    const handleReplySubmit = (e) => {
        e.preventDefault();
        post(route('admin.reviews.reply', review.id));
    };

    const handleRemoveReply = () => {
        router.post(route('admin.reviews.remove-reply', review.id));
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            router.delete(route('admin.reviews.destroy', review.id));
        }
    };

    return (
        <DashboardLayout>
            <Head title={`Review by ${review.reviewer_name}`} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('admin.reviews.index')}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Review Details
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                By {review.reviewer_name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={review.status} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Review Content */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <StarRating rating={review.rating} size="lg" />
                                    {review.title && (
                                        <h3 className="mt-3 text-lg font-semibold text-gray-900">
                                            {review.title}
                                        </h3>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {review.verified_purchase && (
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                            Verified Purchase
                                        </span>
                                    )}
                                    {review.is_featured && (
                                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                                            Featured
                                        </span>
                                    )}
                                </div>
                            </div>

                            {review.body && (
                                <div className="mt-4 text-gray-700 whitespace-pre-wrap">
                                    {review.body}
                                </div>
                            )}

                            {/* Pros and Cons */}
                            {(review.pros?.length > 0 || review.cons?.length > 0) && (
                                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {review.pros?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-green-700">Pros</h4>
                                            <ul className="mt-2 space-y-1">
                                                {review.pros.map((pro, index) => (
                                                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                                        <span className="text-green-500">+</span>
                                                        {pro}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {review.cons?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-red-700">Cons</h4>
                                            <ul className="mt-2 space-y-1">
                                                {review.cons.map((con, index) => (
                                                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                                        <span className="text-red-500">-</span>
                                                        {con}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Helpfulness */}
                            <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
                                <span>{review.helpful_count} found this helpful</span>
                                <span>{review.not_helpful_count} found this unhelpful</span>
                            </div>

                            {/* Submitted Date */}
                            <div className="mt-4 text-sm text-gray-500">
                                Submitted on {new Date(review.created_at).toLocaleString()}
                            </div>
                        </div>

                        {/* Admin Reply */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-medium text-gray-900">Admin Reply</h3>

                            {review.admin_reply ? (
                                <div className="mt-4">
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {review.admin_reply}
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500">
                                            Replied on {new Date(review.admin_replied_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => setData('admin_reply', review.admin_reply)}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            Edit Reply
                                        </button>
                                        <button
                                            onClick={handleRemoveReply}
                                            className="text-sm text-red-600 hover:text-red-800"
                                        >
                                            Remove Reply
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleReplySubmit} className="mt-4">
                                    <textarea
                                        value={data.admin_reply}
                                        onChange={(e) => setData('admin_reply', e.target.value)}
                                        rows={4}
                                        placeholder="Write a public response to this review..."
                                        className="w-full rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500"
                                    />
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={processing || !data.admin_reply.trim()}
                                            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            {processing ? 'Posting...' : 'Post Reply'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-medium text-gray-900">Actions</h3>
                            <div className="mt-4 flex flex-wrap gap-3">
                                {review.status !== 'approved' && (
                                    <button
                                        onClick={handleApprove}
                                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                                    >
                                        Approve Review
                                    </button>
                                )}
                                {review.status !== 'rejected' && (
                                    <button
                                        onClick={handleReject}
                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                    >
                                        Reject Review
                                    </button>
                                )}
                                <button
                                    onClick={handleToggleFeatured}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    {review.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                                >
                                    Delete Review
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Product Info */}
                        {review.product && (
                            <div className="rounded-lg border bg-white p-6 shadow-sm">
                                <h3 className="text-sm font-medium text-gray-500">Product</h3>
                                <div className="mt-4 flex items-center gap-4">
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                        {review.product.image_url ? (
                                            <img
                                                src={review.product.image_url}
                                                alt={review.product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {review.product.name}
                                        </div>
                                        <Link
                                            href={route('admin.products.edit', review.product.id)}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            View Product
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reviewer Info */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm">
                            <h3 className="text-sm font-medium text-gray-500">Reviewer</h3>
                            <div className="mt-4 space-y-3">
                                <div>
                                    <div className="text-sm text-gray-500">Name</div>
                                    <div className="font-medium text-gray-900">{review.reviewer_name}</div>
                                </div>
                                {review.reviewer_email && (
                                    <div>
                                        <div className="text-sm text-gray-500">Email</div>
                                        <div className="font-medium text-gray-900">{review.reviewer_email}</div>
                                    </div>
                                )}
                                {review.user && (
                                    <div>
                                        <div className="text-sm text-gray-500">Account</div>
                                        <div className="font-medium text-gray-900">{review.user.name}</div>
                                    </div>
                                )}
                                {review.order && (
                                    <div>
                                        <div className="text-sm text-gray-500">Order</div>
                                        <Link
                                            href={route('admin.orders.show', review.order.id)}
                                            className="font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            #{review.order.id}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Other Reviews by Customer */}
                        {customerReviews.length > 0 && (
                            <div className="rounded-lg border bg-white p-6 shadow-sm">
                                <h3 className="text-sm font-medium text-gray-500">
                                    Other Reviews by Customer
                                </h3>
                                <div className="mt-4 space-y-4">
                                    {customerReviews.map((otherReview) => (
                                        <Link
                                            key={otherReview.id}
                                            href={route('admin.reviews.show', otherReview.id)}
                                            className="block rounded-lg border p-3 hover:bg-gray-50"
                                        >
                                            <div className="flex items-center justify-between">
                                                <StarRating rating={otherReview.rating} size="sm" />
                                                <StatusBadge status={otherReview.status} />
                                            </div>
                                            <div className="mt-2 text-sm font-medium text-gray-900 truncate">
                                                {otherReview.product?.name || 'Unknown Product'}
                                            </div>
                                            <div className="mt-1 text-xs text-gray-500">
                                                {new Date(otherReview.created_at).toLocaleDateString()}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
