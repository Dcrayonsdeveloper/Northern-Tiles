import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        container: {
            center: true,
            screens: {
                sm: '640px',
                md: '768px',
                lg: '1024px',
                xl: '1280px',
            },
        },
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#085a9c',
                    light: '#0b6fbf',
                    dark: '#063d6b',
                },
                // Trade portal palette — champagne gold on deep navy. Kept
                // separate from `brand` so the retail site is unaffected.
                gold: {
                    DEFAULT: '#c9a961',
                    light: '#ddc48d',
                    dark: '#a8863f',
                },
                navy: {
                    DEFAULT: '#14396e',
                    dark: '#0e2a52',
                },
                dark: '#222222',
                muted: '#555555',
                light: '#f5f5f5',
            },
            fontFamily: {
                sans: ['DM Sans', ...defaultTheme.fontFamily.sans],
                heading: ['Playfair Display', ...defaultTheme.fontFamily.serif],
            },
        },
    },

    plugins: [forms],
};
