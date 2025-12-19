import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    // Use /public/build/ as base for production (Hostinger) where document root is public_html (not public_html/public)
    // In development, use default base (no prefix needed)
    base: command === 'build' ? '/public/build/' : '/',
    build: {
        manifest: true,
        outDir: 'public/build',
        rollupOptions: {
            input: 'resources/js/app.jsx',
        },
    },
}));
