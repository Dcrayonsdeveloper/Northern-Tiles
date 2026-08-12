<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates the /builder trade portal.
 *
 * Guests and signed-in customers who are not builders yet are sent to the
 * trade application page — the "Trade Portal" button that links here is shown
 * to everyone, so a 404 would just be a broken link. Approved builders and
 * admins get the portal itself.
 *
 * Admins are let through so the person who curates the catalogue can actually
 * see what builders see. They are treated as trade for pricing too (see
 * BuilderPricingService::isBuilder), so the preview shows the same prices that
 * would be charged rather than a display-only mock-up that disagrees with the
 * cart.
 */
class BuilderMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // JSON callers (the trade cart drawer + sticky ATC, all of which
        // fetch(/api/builder/cart/*)) need a JSON error, not an HTML redirect
        // — otherwise response.json() throws a SyntaxError on the 302 body
        // and the UI hangs in a loading state with no user-visible message.
        $wantsJson = $request->expectsJson() || $request->is('api/*');

        if (! $user) {
            return $wantsJson
                ? response()->json(['message' => 'Unauthenticated.'], 401)
                : redirect()->route('builder.register');
        }

        if (! $user->is_active) {
            return $wantsJson
                ? response()->json(['message' => 'Your account is inactive. Ordering is disabled.'], 403)
                : abort(404);
        }

        if ($user->is_admin) {
            return $next($request);
        }

        if ($user->isPendingBuilder()) {
            return $wantsJson
                ? response()->json(['message' => 'Your trade application is still being reviewed.'], 403)
                : redirect()->route('builder.pending');
        }

        if (! $user->isBuilder()) {
            return $wantsJson
                ? response()->json(['message' => 'Trade access is required.'], 403)
                : redirect()->route('builder.register');
        }

        return $next($request);
    }
}
