<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status'           => session('status'),
            // Sent here by the Checkout button: signing in is the last step
            // of their order, not a detour, and the page says so.
            'fromCheckout'     => session('url.intended') === route('checkout.index'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     *
     * On a lockout (5 failed attempts), we catch the ValidationException
     * before Inertia can handle it so we can flash `retry_after` to the
     * session.  Inertia's HandleInertiaRequests middleware then exposes it
     * as `flash.retry_after` on the next page render, where the frontend
     * reads it to start the countdown timer.
     *
     * Wrong-credential errors are re-thrown so Inertia handles them through
     * the normal ValidationException → errors-prop pipeline.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // Capture the guest session id BEFORE authenticate(). The guest cart
        // row is keyed by it (session_id = OLD_SID, user_id = NULL), and
        // Auth::attempt() regenerates the session as it logs the user in —
        // read it any later and the merge below looks up an id no cart has,
        // so the cart a guest filled before checkout is silently orphaned.
        $oldSessionId = $request->session()->getId();

        try {
            $request->authenticate();
        } catch (ValidationException $e) {
            $retryAfter = $request->retryAfter();

            if ($retryAfter > 0) {
                // Account is locked — forward retry_after to the frontend.
                return back()
                    ->withErrors($e->errors())
                    ->with('retry_after', $retryAfter);
            }

            // Wrong credentials — let Inertia handle it normally.
            throw $e;
        }

        $request->session()->regenerate();

        $user = $request->user();

        // Reclaim the pre-login retail guest cart onto the user account.
        // mergeGuestCart is retail-only by construction (guests never have
        // trade access), and its dedupe key includes is_sample + options_json
        // so free samples stay free and colour/finish selections survive.
        try {
            app(\App\Domain\Cart\Services\CartService::class)
                ->mergeGuestCart($user->id, $oldSessionId);
        } catch (\Throwable $e) {
            // Never fail login because a cart merge went wrong.
            \Log::warning('Guest cart merge on login failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        // Route each account type to where it belongs. Regular customers land
        // on the storefront (the website) — never the member dashboard.
        //   - Pending builder  -> the "account under review (24–48h)" page
        //   - Approved builder -> the trade portal
        //   - Admin / seller   -> their own panel
        //   - Everyone else    -> the website home
        if ($user->isPendingBuilder()) {
            return redirect()->route('builder.pending');
        }

        if ($user->isBuilder()) {
            return redirect()->intended(route('builder.dashboard', absolute: false));
        }

        if ($user->is_admin) {
            return redirect()->intended(route('admin.dashboard', absolute: false));
        }

        if ($user->isApprovedSeller()) {
            return redirect()->intended(route('seller.dashboard', absolute: false));
        }

        return redirect()->intended(route('home', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
