import { usePage } from '@inertiajs/react';

// Star icon component
function StarIcon({ className, filled = false, half = false }) {
    if (half) {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                <defs>
                    <linearGradient id="halfGradient">
                        <stop offset="50%" stopColor="currentColor" />
                        <stop offset="50%" stopColor="transparent" />
                    </linearGradient>
                </defs>
                <path
                    fill="url(#halfGradient)"
                    stroke="currentColor"
                    strokeWidth="1"
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
            </svg>
        );
    }

    return (
        <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
        </svg>
    );
}

// Display rating stars (read-only)
export function StarRating({
    rating = 0,
    maxRating = 5,
    size = 'md',
    showCount = false,
    reviewCount = 0,
    usePrimaryColor = true,
    className = '',
}) {
    const { settings } = usePage().props;
    const primaryColor = settings?.colors?.primary || '#f59e0b'; // Default amber if no primary set

    const sizes = {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-7 w-7',
    };

    const starSize = sizes[size] || sizes.md;

    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
        const filled = i <= Math.floor(rating);
        const half = !filled && i === Math.ceil(rating) && rating % 1 >= 0.5;

        stars.push(
            <StarIcon
                key={i}
                className={`${starSize} ${filled || half ? '' : 'opacity-30'}`}
                filled={filled}
                half={half}
            />
        );
    }

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div
                className="flex"
                style={{ color: usePrimaryColor ? primaryColor : 'currentColor' }}
            >
                {stars}
            </div>
            {showCount && (
                <span className="text-xs text-gray-500 ml-1">
                    ({reviewCount})
                </span>
            )}
        </div>
    );
}

// Interactive rating input
export function StarRatingInput({
    value = 0,
    onChange,
    maxRating = 5,
    size = 'lg',
    disabled = false,
    usePrimaryColor = true,
    className = '',
}) {
    const { settings } = usePage().props;
    const primaryColor = settings?.colors?.primary || '#f59e0b';

    const sizes = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-10 w-10',
        xl: 'h-12 w-12',
    };

    const starSize = sizes[size] || sizes.lg;

    const handleClick = (rating) => {
        if (!disabled && onChange) {
            onChange(rating);
        }
    };

    return (
        <div className={`flex gap-1 ${className}`}>
            {[...Array(maxRating)].map((_, index) => {
                const rating = index + 1;
                const filled = rating <= value;

                return (
                    <button
                        key={rating}
                        type="button"
                        onClick={() => handleClick(rating)}
                        disabled={disabled}
                        className={`transition-transform ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                        aria-label={`Rate ${rating} out of ${maxRating}`}
                    >
                        <StarIcon
                            className={`${starSize} ${filled ? '' : 'opacity-30'}`}
                            filled={filled}
                            style={{ color: usePrimaryColor ? primaryColor : 'currentColor' }}
                        />
                    </button>
                );
            })}
        </div>
    );
}

// Rating summary with distribution bars
export function RatingSummary({
    average = 0,
    total = 0,
    distribution = {},
    usePrimaryColor = true,
    className = '',
}) {
    const { settings } = usePage().props;
    const primaryColor = settings?.colors?.primary || '#f59e0b';

    return (
        <div className={`flex gap-8 ${className}`}>
            {/* Average rating */}
            <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                    {average.toFixed(1)}
                </div>
                <StarRating rating={average} size="md" usePrimaryColor={usePrimaryColor} />
                <div className="mt-1 text-sm text-gray-500">
                    {total} {total === 1 ? 'review' : 'reviews'}
                </div>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                    const data = distribution[star] || { count: 0, percentage: 0 };
                    return (
                        <div key={star} className="flex items-center gap-2">
                            <span className="w-3 text-xs text-gray-600">{star}</span>
                            <StarIcon className="h-3 w-3" filled style={{ color: primaryColor }} />
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${data.percentage}%`,
                                        backgroundColor: primaryColor,
                                    }}
                                />
                            </div>
                            <span className="w-8 text-xs text-gray-500 text-right">
                                {data.count}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default StarRating;
