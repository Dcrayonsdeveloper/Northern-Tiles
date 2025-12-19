import '../scss/app.scss';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initDictionary } from '@/Support/dictionary';

let appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const el = document.getElementById('app');

if (el?.dataset?.page) {
    try {
        const page = JSON.parse(el.dataset.page);
        appName = page?.props?.site?.title || appName;
        // Initialize dictionary for non-hook usage
        initDictionary(page?.props?.dictionary?.items);
    } catch {
    }
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        appName = props?.initialPage?.props?.site?.title || appName;
        // Initialize dictionary for non-hook usage
        initDictionary(props?.initialPage?.props?.dictionary?.items);
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
