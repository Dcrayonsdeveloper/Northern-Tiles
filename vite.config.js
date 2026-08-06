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

const legacyPublicPrefix = process.env.VITE_LEGACY_PUBLIC_PREFIX === 'true';

// Records which asset layout this bundle was built for. The deploy script
// compares it against the server's LEGACY_PUBLIC_PREFIX and refuses to go live
// on a mismatch, because that combination serves a site with no CSS or JS.
function emitBuildMeta() {
    return {
        name: 'ntd-build-meta',
        apply: 'build',
        generateBundle() {
            this.emitFile({
                type: 'asset',
                fileName: 'build-meta.json',
                source: JSON.stringify({ legacyPublicPrefix }, null, 2),
            });
        },
    };
}

export default defineConfig(({ command }) => ({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
        emitBuildMeta(),
    ],
    // Asset base path. Must agree with LEGACY_PUBLIC_PREFIX in the server's
    // .env — that flag drives the matching runtime rewrite in FixAssetPaths.
    //
    //   VITE_LEGACY_PUBLIC_PREFIX=false (default) -> /build/
    //     document root points at public/ — the correct layout.
    //   VITE_LEGACY_PUBLIC_PREFIX=true            -> /public/build/
    //     document root is the application root — legacy shared-hosting layout.
    //
    // A mismatch between build-time and runtime 404s every asset.
    base: command === 'build' ? (legacyPublicPrefix ? '/public/build/' : '/build/') : '/',
    server: {
        host: '0.0.0.0',
        // Allow requests from any origin — needed because the Laravel app is served
        // from :8000 (or the LAN IP) while Vite runs on :5173, so browsers see them
        // as different origins and enforce CORS on dev-mode script fetches.
        cors: {
            origin: /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+)(:\d+)?$/,
        },
        // Force asset URLs emitted by laravel-vite-plugin to use the LAN IP so
        // other devices on the network load them correctly (not 'localhost').
        origin: `http://${lanHost}:5173`,
        hmr: {
            host: lanHost,
        },
    },
    build: {
        manifest: 'manifest.json',
        outDir: 'public/build',
        rollupOptions: {
            input: 'resources/js/app.jsx',
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-inertia': ['@inertiajs/react'],
                },
            },
        },
    },
}));
