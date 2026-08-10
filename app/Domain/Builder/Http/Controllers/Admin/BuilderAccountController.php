<?php

namespace App\Domain\Builder\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin → Builder Panel → Accounts.
 *
 * Trade accounts are created by the admin, not self-registered — that is what
 * makes the portal "exclusive". This screen is where they are issued, named
 * and revoked.
 */
class BuilderAccountController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('q', ''));

        $builders = User::query()
            ->where('is_builder', true)
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('builder_company', 'like', "%{$search}%");
                });
            })
            ->withCount('orders')
            ->orderByDesc('builder_approved_at')
            ->paginate(20)
            ->withQueryString();

        $builders->getCollection()->transform(function (User $user) {
            $user->total_spent = (float) Order::where('user_id', $user->id)
                ->where('payment_status', 'paid')
                ->sum('total');

            return $user;
        });

        return Inertia::render('Admin/BuilderCatalog/Accounts', [
            'builders' => $builders,
            'filters' => ['q' => $search],
            'stats' => [
                'total' => User::where('is_builder', true)->count(),
                'active' => User::where('is_builder', true)->where('is_active', true)->count(),
            ],
        ]);
    }

    /**
     * Issue a new trade account. The admin sets the password and passes it to
     * the builder — there is no public builder sign-up.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->whereNull('deleted_at')],
            'builder_company' => ['nullable', 'string', 'max:255'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'builder_company' => $validated['builder_company'] ?? null,
            'password' => Hash::make($validated['password']),
            'is_builder' => true,
            'is_active' => true,
            'builder_approved_at' => now(),
            // Admin-issued accounts are trusted; no verification email loop.
            'email_verified_at' => now(),
        ]);

        return back()->with('success', 'Builder account created.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)->whereNull('deleted_at')],
            'builder_company' => ['nullable', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'builder_company' => $validated['builder_company'] ?? null,
            'is_active' => $validated['is_active'],
        ]);

        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return back()->with('success', 'Builder account updated.');
    }

    /**
     * Promote an existing customer to a trade account, or revoke it.
     * Revoking clears the flag but leaves the account (and its order history)
     * intact — it simply drops back to retail pricing.
     */
    public function toggle(Request $request, User $user): RedirectResponse
    {
        $makeBuilder = ! $user->is_builder;

        $user->update([
            'is_builder' => $makeBuilder,
            'builder_approved_at' => $makeBuilder ? now() : null,
        ]);

        return back()->with(
            'success',
            $makeBuilder
                ? "{$user->name} now has builder access."
                : "Builder access revoked for {$user->name}."
        );
    }
}
