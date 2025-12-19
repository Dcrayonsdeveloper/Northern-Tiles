import { useState } from 'react';
import api from '@/Support/api';

export default function FavoriteButton({ productId, isFavorite: initialFavorite, onToggle, size = 'md' }) {
    const [isFavorite, setIsFavorite] = useState(initialFavorite);
    const [isLoading, setIsLoading] = useState(false);

    const sizeClasses = {
        sm: 'h-7 w-7',
        md: 'h-9 w-9',
        lg: 'h-11 w-11',
    };

    const iconSizes = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
    };

    const handleToggle = async () => {
        if (isLoading) return;

        setIsLoading(true);
        const previousState = isFavorite;
        setIsFavorite(!isFavorite);

        try {
            await api.favorites.toggle(productId);
            onToggle?.(productId, !previousState);
        } catch (error) {
            setIsFavorite(previousState);
            console.error('Failed to toggle favorite:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            disabled={isLoading}
            className={`${sizeClasses[size]} inline-flex items-center justify-center rounded-full border transition-colors duration-200 ${
                isFavorite
                    ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                    : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-red-500'
            } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            <svg
                className={iconSizes[size]}
                viewBox="0 0 24 24"
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={isFavorite ? 0 : 2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
            </svg>
        </button>
    );
}
