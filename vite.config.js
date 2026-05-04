import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import os from 'os';

// Pick the first non-internal IPv4 address so the dev server is reachable from
// other devices on the LAN. Falls back to localhost when none is available.
function getLanHost() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

const lanHost = getLanHost();

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
    server: {
        host: '0.0.0.0',
        hmr: {
            host: lanHost,
        },
    },
    build: {
        manifest: 'manifest.json',
        outDir: 'public/build',
        rollupOptions: {
            input: 'resources/js/app.jsx',
        },
    },
}));
