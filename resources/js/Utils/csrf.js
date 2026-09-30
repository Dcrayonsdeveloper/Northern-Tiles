/**
 * Headers that prove a fetch came from the open session.
 *
 * The csrf-token meta tag is written into the HTML once, when the page is
 * rendered. Leave an admin tab open past SESSION_LIFETIME and that tag is
 * stale, so every upload comes back 419 while the page still looks signed in.
 *
 * The XSRF-TOKEN cookie is refreshed on every response, so it is the one to
 * trust. Laravel reads X-CSRF-TOKEN first and only falls back to X-XSRF-TOKEN
 * when the former is absent -- so sending both would let a stale tag beat the
 * fresh cookie. Exactly one is sent, cookie preferred.
 */
export function csrfHeaders(extra = {}) {
    const headers = { ...extra };

    const cookie = document.cookie
        .split('; ')
        .find((part) => part.startsWith('XSRF-TOKEN='));

    if (cookie) {
        headers['X-XSRF-TOKEN'] = decodeURIComponent(cookie.slice('XSRF-TOKEN='.length));
        return headers;
    }

    const meta = document.querySelector('meta[name="csrf-token"]')?.content;
    if (meta) {
        headers['X-CSRF-TOKEN'] = meta;
    }

    return headers;
}

/** 419 means the session is gone, not that the request was wrong. */
export const SESSION_EXPIRED = 419;

export const SESSION_EXPIRED_MESSAGE =
    'Your session has expired. Refresh the page, sign in again, then retry.';
