<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        // Read before Auth::login(), which regenerates the session: the guest
        // cart is keyed by this id. See AuthenticatedSessionController::store.
        $guestSessionId = $request->session()->getId();

        Auth::login($user);

        // A guest who filled a cart signs up at checkout, so their cart has
        // to come with them into the new account.
        try {
            app(\App\Domain\Cart\Services\CartService::class)
                ->mergeGuestCart($user->id, $guestSessionId);
        } catch (\Throwable $e) {
            // Never fail a sign-up because a cart merge went wrong.
            \Log::warning('Guest cart merge on registration failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        // New sign-ups are regular customers — send them back to checkout if
        // that is what asked them to sign in, otherwise to the storefront,
        // never the member dashboard.
        return redirect()->intended(route('home', absolute: false));
    }
}
