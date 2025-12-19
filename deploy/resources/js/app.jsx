import '../scss/app.scss';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

let appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const el = document.getElementById('app');

if (el?.dataset?.page) {
    try {
        const page = JSON.parse(el.dataset.page);
        appName = page?.props?.site?.title || appName;
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
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
