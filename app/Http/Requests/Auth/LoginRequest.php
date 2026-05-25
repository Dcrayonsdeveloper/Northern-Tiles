<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * On failure, increments both the per-account counter and the per-IP flood
     * counter. On success, clears the per-account counter only — the IP flood
     * counter is intentionally NOT cleared so that one successful login from a
     * shared IP cannot drain the flood budget for everyone else on that IP.
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey(), 60);
            RateLimiter::hit($this->floodKey(), 60);

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Gate: throw a ValidationException before Auth::attempt() runs if either
     * limiter is already exhausted.
     *
     * Check order matters:
     *   1. Flood guard first (IP-wide, credential-stuffing protection).
     *   2. Per-account guard second (email+IP, targeted brute-force protection).
     *
     * Both throw the same auth.throttle message so the attacker cannot infer
     * which limit fired. The Lockout event is only fired for per-account locks
     * because that is the only case that maps to a real user account.
     */
    public function ensureIsNotRateLimited(): void
    {
        // ── Flood guard ───────────────────────────────────────────────────────
        // 60 failures / minute / IP.
        // Under normal office usage (20 people, each mistype once) you'd generate
        // ~20 failures — well under the threshold. Under credential stuffing
        // (one IP rotating through thousands of email:password pairs) the counter
        // reaches 60 quickly. The threshold is intentionally NOT lowered so that
        // shared NAT / corporate proxies are never locked out by ordinary usage.
        if (RateLimiter::tooManyAttempts($this->floodKey(), 60)) {
            $seconds = RateLimiter::availableIn($this->floodKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.throttle', [
                    'seconds' => $seconds,
                    'minutes' => ceil($seconds / 60),
                ]),
            ]);
        }

        // ── Per-account guard ─────────────────────────────────────────────────
        // 5 failures / 60 s / (email + IP + auth context).
        // ONLY this specific email from this specific IP is locked.
        // alice@example.com locked from 1.2.3.4 → bob@example.com from 1.2.3.4
        // and alice@example.com from 5.6.7.8 are completely unaffected.
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Seconds until the active lockout expires, or 0 if no lockout is active.
     *
     * Used by AuthenticatedSessionController to decide whether to flash
     * retry_after to the session (and therefore start the frontend countdown).
     *
     * MUST use tooManyAttempts() as the gate, not availableIn() alone.
     *
     * Why: RateLimiter::hit() sets a decay-window timer on the very first call.
     * availableIn() reads that timer and returns ~60 s even after only 1 failed
     * attempt — the counter is 1, but the timer already exists.  Calling
     * availableIn() without first checking tooManyAttempts() makes every failed
     * attempt look like a lockout, which is exactly the "locked after 1 attempt"
     * bug.  tooManyAttempts($key, 5) is only true when attempts() >= 5.
     */
    public function retryAfter(): int
    {
        if (RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return max(0, RateLimiter::availableIn($this->throttleKey()));
        }

        if (RateLimiter::tooManyAttempts($this->floodKey(), 60)) {
            return max(0, RateLimiter::availableIn($this->floodKey()));
        }

        return 0;
    }

    /**
     * Per-account throttle key.
     *
     * Format: login.{admin|user}.{email}.{ip}
     *
     * Unique per email address, per originating IP, and per auth context.
     * Locking alice@example.com from 1.2.3.4 has zero effect on any other
     * email or any other IP — including the same email from a different IP.
     *
     * Admin vs user isolation: a brute-force campaign against regular accounts
     * cannot consume the admin counter, and vice versa.
     *
     * Email normalisation: strtolower + trim matches how Auth::attempt() looks
     * up the user. No transliteration — transliteration can collapse distinct
     * Unicode addresses (e.g. çafe@ → cafe@) onto the same key.
     *
     * Memoised because this method is called three times per request
     * (ensureIsNotRateLimited → hit → clear/check), and the DB lookup for
     * is_admin must return the same result for all three to use the same key.
     */
    public function throttleKey(): string
    {
        if ($this->memoThrottleKey !== null) {
            return $this->memoThrottleKey;
        }

        $email   = strtolower(trim($this->input('email', '')));
        $isAdmin = User::where('email', $email)->value('is_admin');
        $context = $isAdmin ? 'admin' : 'user';

        return $this->memoThrottleKey =
            'login.' . $context . '.' . $email . '.' . $this->ip();
    }

    /**
     * Per-IP flood key.
     *
     * Shared across all accounts on this IP — deliberately email-agnostic.
     * Exists specifically to catch credential stuffing, where the attacker
     * spreads requests across many email addresses to stay under the per-account
     * threshold. Keyed only on IP so it accumulates across all such attempts.
     */
    public function floodKey(): string
    {
        return 'login.flood.' . $this->ip();
    }

    private ?string $memoThrottleKey = null;
}
