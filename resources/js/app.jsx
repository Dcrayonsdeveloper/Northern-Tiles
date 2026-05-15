import '../scss/app.scss';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initDictionary } from '@/Support/dictionary';
import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(error) { return { error }; }
    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#fff1f0', border: '2px solid red', margin: '1rem', borderRadius: '8px' }}>
                    <h2 style={{ color: 'red' }}>React Error</h2>
                    <pre style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{this.state.error.message}</pre>
                    <pre style={{ whiteSpace: 'pre-wrap', color: '#666', fontSize: '12px' }}>{this.state.error.stack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

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

        root.render(<ErrorBoundary><App {...props} /></ErrorBoundary>);
    },
    progress: {
        color: '#4B5563',
    },
});
