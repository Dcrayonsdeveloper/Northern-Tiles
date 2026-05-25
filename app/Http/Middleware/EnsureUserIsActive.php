<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    private const MESSAGE = 'Your account is inactive. Ordering is disabled.';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Unauthenticated guests, admins, and sellers are never blocked.
        if (! $user || $user->is_admin || $user->is_seller) {
            return $next($request);
        }

        if (! $user->is_active) {
            // JSON / AJAX callers (api/cart routes) get a machine-readable 403.
            if ($request->expectsJson()) {
                return response()->json(['message' => self::MESSAGE], 403);
            }

            // Inertia / web form submissions redirect back with a flash error
            // that the FlashMessage component picks up automatically.
            return back()->with('error', self::MESSAGE);
        }

        return $next($request);
    }
}
