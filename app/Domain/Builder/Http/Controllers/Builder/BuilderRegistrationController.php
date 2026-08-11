<?php

namespace App\Domain\Builder\Http\Controllers\Builder;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\AustralianBusinessNumber;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public trade-account sign-up.
 *
 * Anyone may apply, but an application is not access: the account is created
 * in a pending state and an admin has to approve it before the portal opens or
 * trade pricing applies.
 */
class BuilderRegistrationController extends Controller
{
    /**
     * The "join the trade programme" landing page — sign in, or apply.
     * Already-approved builders skip straight to the portal.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user?->isBuilder() || $user?->is_admin) {
            return redirect()->route('builder.dashboard');
        }

        if ($user?->isPendingBuilder()) {
            return redirect()->route('builder.pending');
        }

        return Inertia::render('Builder/Register', [
            'isLoggedIn' => (bool) $user,
            'currentUser' => $user ? [
                'name' => $user->name,
                'email' => $user->email,
            ] : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        // An existing customer applying for trade: upgrade the account they
        // already have rather than forcing a duplicate signup under the same
        // email, which the unique rule would reject anyway.
        if ($user) {
            $validated = $request->validate([
                'builder_company' => ['required', 'string', 'max:255'],
                'builder_abn' => ['required', 'string', 'max:20', new AustralianBusinessNumber()],
                'phone' => ['required', 'string', 'max:30'],
            ], [], $this->attributeNames());

            $user->update([
                'is_builder' => true,
                'builder_company' => $validated['builder_company'],
                'builder_abn' => AustralianBusinessNumber::normalise($validated['builder_abn']),
                'phone' => $validated['phone'],
                'builder_approved_at' => null,
            ]);

            return redirect()->route('builder.pending');
        }

        // Every field is compulsory: an application we cannot phone back or
        // verify against an ABN is not one an admin can approve.
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'builder_company' => ['required', 'string', 'max:255'],
            'builder_abn' => ['required', 'string', 'max:20', new AustralianBusinessNumber()],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->whereNull('deleted_at')],
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ], [], $this->attributeNames());

        $newUser = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'builder_company' => $validated['builder_company'],
            'builder_abn' => AustralianBusinessNumber::normalise($validated['builder_abn']),
            'is_builder' => true,
            // Pending, not approved. Deliberately NOT is_active = false: that
            // flag disables ordering site-wide, which would stop an applicant
            // buying at retail while they wait.
            'builder_approved_at' => null,
            'is_active' => true,
        ]);

        event(new Registered($newUser));

        Auth::login($newUser);
        $request->session()->regenerate();

        return redirect()->route('builder.pending');
    }

    /**
     * "Thanks, we're reviewing it" — the page the confirmation modal sits on,
     * and where a pending builder is sent if they try the portal early.
     */
    public function pending(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('builder.register');
        }

        if ($user->isBuilder() || $user->is_admin) {
            return redirect()->route('builder.dashboard');
        }

        if (! $user->isPendingBuilder()) {
            return redirect()->route('builder.register');
        }

        return Inertia::render('Builder/Pending', [
            'company' => $user->builder_company,
            'email' => $user->email,
        ]);
    }

    /**
     * Friendlier names in validation messages — "The builder abn field is
     * required" reads badly next to a field labelled "Company ABN".
     */
    protected function attributeNames(): array
    {
        return [
            'builder_company' => 'company name',
            'builder_abn' => 'Company ABN',
            'phone' => 'phone number',
        ];
    }
}
