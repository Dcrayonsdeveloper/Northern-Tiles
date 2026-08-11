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

        // Guests land on the trade sign-up page, which offers both "sign in"
        // and "apply". Sending them to the bare login form would strand any
        // builder who does not have an account yet.
        if (! $user) {
            return redirect()->route('builder.register');
        }

        if (! $user->is_active) {
            abort(404);
        }

        if ($user->is_admin) {
            return $next($request);
        }

        // Signed up but not approved yet: send them to the status page rather
        // than a 404, so they can see their application is being reviewed
        // instead of thinking the site is broken.
        if ($user->isPendingBuilder()) {
            return redirect()->route('builder.pending');
        }

        // A signed-in customer who is not a builder yet: send them to the trade
        // application page instead of a dead-end 404. The apply page handles a
        // logged-in user (it upgrades the account they already have), so this is
        // exactly where the "Trade Portal" button should take them.
        if (! $user->isBuilder()) {
            return redirect()->route('builder.register');
        }

        return $next($request);
    }
}
