/**
 * "Review us on Trustpilot" call to action.
 *
 * The Trustpilot widget renders inside an iframe, so its contents cannot be
 * wrapped in a link of ours — a click on the logo it draws is Trustpilot's to
 * handle, and when the business unit has no reviews yet the widget collapses
 * to a bare logo that goes nowhere. This link sits outside the iframe and is
 * the reliable way to reach the review page from any page that shows reviews.
 */

/** Falls back to the live review page when the env var is unset at build time. */
export const TRUSTPILOT_REVIEW_URL =
    import.meta.env.VITE_TRUSTPILOT_REVIEW_URL
    ?? 'https://www.trustpilot.com/review/ntiled.com.au?utm_medium=trustbox&utm_source=TrustBoxReviewCollector';

export default function TrustpilotReviewLink({ className = 'mt-8' }) {
    return (
        <div className={`flex justify-center ${className}`}>
            <a
                href={TRUSTPILOT_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-5 py-2.5 text-[14px] text-gray-700 transition hover:border-gray-400 hover:shadow-sm"
            >
                Review us on
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#191919]">
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="#00b67a" aria-hidden="true">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Trustpilot
                </span>
            </a>
        </div>
    );
}
