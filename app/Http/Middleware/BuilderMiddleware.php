<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates the /builder trade portal.
 *
 * Guests are sent to login rather than shown a 403, so a builder who clicks a
 * bookmarked portal link lands on the sign-in page and is returned afterwards.
 * Signed-in non-builders get a 404 — the portal's existence, its catalogue and
 * its pricing are all private.
 */
class BuilderMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->guest(route('login'));
        }

        if (! $user->is_builder || ! $user->is_active) {
            abort(404);
        }

        return $next($request);
    }
}
