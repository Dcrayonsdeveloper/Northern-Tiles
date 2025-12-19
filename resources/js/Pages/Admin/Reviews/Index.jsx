import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

function SearchIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

function CheckIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}

function XIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function StarRating({ rating }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                    key={star}
                    className={`h-4 w-4 ${star <= rating ? 'text-amber-400' : 'text-gray-300'}`}
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
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[status]}`}>
            {status}
        </span>
    );
}

export default function Index({ reviews, stats, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedRating, setSelectedRating] = useState(filters.rating || '');
    const [selectedIds, setSelectedIds] = useState([]);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.reviews.index'), {
            search,
            status: selectedStatus,
            rating: selectedRating,
        }, { preserveState: true });
    };

    const handleFilter = (key, value) => {
        router.get(route('admin.reviews.index'), {
            search,
            status: key === 'status' ? value : selectedStatus,
            rating: key === 'rating' ? value : selectedRating,
        }, { preserveState: true });
    };

    const handleApprove = (reviewId) => {
        router.post(route('admin.reviews.approve', reviewId));
    };

    const handleReject = (reviewId) => {
        router.post(route('admin.reviews.reject', reviewId));
    };

    const handleDelete = (review) => {
        if (confirm('Are you sure you want to delete this review?')) {
            router.delete(route('admin.reviews.destroy', review.id));
        }
    };

    const handleBulkApprove = () => {
        if (selectedIds.length === 0) return;
        router.post(route('admin.reviews.bulk-approve'), { ids: selectedIds });
        setSelectedIds([]);
    };

    const handleBulkReject = () => {
        if (selectedIds.length === 0) return;
        router.post(route('admin.reviews.bulk-reject'), { ids: selectedIds });
        setSelectedIds([]);
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === reviews.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(reviews.data.map(r => r.id));
        }
    };

    return (
        <DashboardLayout>
            <Head title="Reviews" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Reviews</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage customer product reviews
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="text-sm font-medium text-gray-500">Total Reviews</div>
                        <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="text-sm font-medium text-gray-500">Pending</div>
                        <div className="mt-1 text-2xl font-semibold text-yellow-600">{stats.pending}</div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="text-sm font-medium text-gray-500">Approved</div>
                        <div className="mt-1 text-2xl font-semibold text-green-600">{stats.approved}</div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="text-sm font-medium text-gray-500">Rejected</div>
                        <div className="mt-1 text-2xl font-semibold text-red-600">{stats.rejected}</div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="text-sm font-medium text-gray-500">Average Rating</div>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="text-2xl font-semibold text-gray-900">{stats.average_rating}</span>
                            <StarIcon className="h-5 w-5 text-amber-400" filled />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search reviews..."
                                className="w-full rounded-lg border-gray-300 pl-10 text-sm focus:border-gray-500 focus:ring-gray-500"
                            />
                        </div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                handleFilter('status', e.target.value);
                            }}
                            className="rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <select
                            value={selectedRating}
                            onChange={(e) => {
                                setSelectedRating(e.target.value);
                                handleFilter('rating', e.target.value);
                            }}
                            className="rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500"
                        >
                            <option value="">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                        <button
                            type="submit"
                            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <span className="text-sm font-medium text-blue-800">
                            {selectedIds.length} review{selectedIds.length > 1 ? 's' : ''} selected
                        </span>
                        <button
                            onClick={handleBulkApprove}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                        >
                            Approve All
                        </button>
                        <button
                            onClick={handleBulkReject}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                        >
                            Reject All
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                {/* Table */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === reviews.data.length && reviews.data.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Review
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Rating
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {reviews.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <StarIcon className="mx-auto h-12 w-12 text-gray-300" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews found</h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Reviews will appear here when customers submit them.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    reviews.data.map((review) => (
                                        <tr key={review.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(review.id)}
                                                    onChange={() => toggleSelect(review.id)}
                                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    <div className="font-medium text-gray-900">
                                                        {review.reviewer_name}
                                                        {review.verified_purchase && (
                                                            <span className="ml-2 inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                                                                Verified
                                                            </span>
                                                        )}
                                                    </div>
                                                    {review.title && (
                                                        <div className="text-sm font-medium text-gray-700 truncate">
                                                            {review.title}
                                                        </div>
                                                    )}
                                                    <div className="text-sm text-gray-500 line-clamp-2">
                                                        {review.body || 'No comment'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {review.product ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                                            {review.product.image_url ? (
                                                                <img
                                                                    src={review.product.image_url}
                                                                    alt={review.product.name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center text-gray-400">
                                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                                            {review.product.name}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">Product deleted</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StarRating rating={review.rating} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={review.status} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {review.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(review.id)}
                                                                className="rounded p-1 text-green-600 hover:bg-green-50"
                                                                title="Approve"
                                                            >
                                                                <CheckIcon className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(review.id)}
                                                                className="rounded p-1 text-red-600 hover:bg-red-50"
                                                                title="Reject"
                                                            >
                                                                <XIcon className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <Link
                                                        href={route('admin.reviews.show', review.id)}
                                                        className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                                                    >
                                                        View
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(review)}
                                                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {reviews.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-6 py-3">
                            <div className="text-sm text-gray-500">
                                Showing {reviews.from} to {reviews.to} of {reviews.total} results
                            </div>
                            <div className="flex gap-2">
                                {reviews.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`rounded px-3 py-1 text-sm ${
                                            link.active
                                                ? 'bg-gray-900 text-white'
                                                : link.url
                                                ? 'text-gray-600 hover:bg-gray-100'
                                                : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
