import { useEffect, useRef } from 'react';

const BOOTSTRAP_SRC = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
const CAROUSEL_TEMPLATE_ID = '53aa8912dec7e10d38f59f36';

function loadBootstrap() {
    if (window.__trustpilotBootstrapPromise) return window.__trustpilotBootstrapPromise;

    window.__trustpilotBootstrapPromise = new Promise((resolve, reject) => {
        if (window.Trustpilot) {
            resolve(window.Trustpilot);
            return;
        }
        const existing = document.querySelector(`script[src="${BOOTSTRAP_SRC}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve(window.Trustpilot));
            existing.addEventListener('error', reject);
            return;
        }
        const s = document.createElement('script');
        s.src = BOOTSTRAP_SRC;
        s.async = true;
        s.onload = () => resolve(window.Trustpilot);
        s.onerror = reject;
        document.head.appendChild(s);
    });

    return window.__trustpilotBootstrapPromise;
}

export default function TrustpilotCarousel({
    businessUnitId,
    templateId = CAROUSEL_TEMPLATE_ID,
    height = '240px',
    width = '100%',
    theme = 'light',
    locale = 'en-AU',
    reviewUrl = import.meta.env.VITE_TRUSTPILOT_REVIEW_URL ?? 'https://www.trustpilot.com/review/ntiled.com.au',
}) {
    const ref = useRef(null);

    useEffect(() => {
        if (!businessUnitId || !ref.current) return;

        let cancelled = false;
        loadBootstrap()
            .then((Trustpilot) => {
                if (cancelled || !Trustpilot || !ref.current) return;
                Trustpilot.loadFromElement(ref.current, true);
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [businessUnitId, templateId]);

    if (!businessUnitId) return null;

    return (
        <div
            ref={ref}
            className="trustpilot-widget"
            data-locale={locale}
            data-template-id={templateId}
            data-businessunit-id={businessUnitId}
            data-style-height={height}
            data-style-width={width}
            data-theme={theme}
        >
            <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
                Trustpilot
            </a>
        </div>
    );
}
