<?php

namespace App\Domain\Builder\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Rules\AustralianBusinessNumber;
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
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('builder_abn', 'like', "%{$search}%")
                        ->orWhere('builder_company', 'like', "%{$search}%");
                });
            })
            ->withCount('orders')
            // Pending applications first — they are the ones needing action.
            ->orderByRaw('builder_approved_at IS NULL DESC')
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $builders->getCollection()->transform(function (User $user) {
            $user->total_spent = (float) Order::where('user_id', $user->id)
                ->where('payment_status', 'paid')
                ->sum('total');

            $user->last_order_at = Order::where('user_id', $user->id)
                ->latest('created_at')
                ->value('created_at');

            return $user;
        });

        return Inertia::render('Admin/BuilderCatalog/Accounts', [
            'builders' => $builders,
            'filters' => ['q' => $search],
            'stats' => [
                'total' => User::where('is_builder', true)->count(),
                'active' => User::where('is_builder', true)
                    ->whereNotNull('builder_approved_at')
                    ->where('is_active', true)
                    ->count(),
                'pending' => User::where('is_builder', true)
                    ->whereNull('builder_approved_at')
                    ->count(),
            ],
        ]);
    }

    /**
     * Approve a pending application — this is what actually opens the portal
     * and switches the account onto trade pricing.
     */
    public function approve(User $user): RedirectResponse
    {
        $user->update([
            'is_builder' => true,
            'builder_approved_at' => now(),
            'is_active' => true,
        ]);

        return back()->with('success', "{$user->name} approved — trade pricing is now active for them.");
    }

    /**
     * Send an account back to pending without deleting it, e.g. if the details
     * need checking. They keep retail access throughout.
     */
    public function unapprove(User $user): RedirectResponse
    {
        $user->update(['builder_approved_at' => null]);

        return back()->with('success', "{$user->name} moved back to pending — they are on retail pricing again.");
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
            'phone' => ['nullable', 'string', 'max:30'],
            'builder_company' => ['nullable', 'string', 'max:255'],
            'builder_abn' => ['nullable', 'string', 'max:20', new AustralianBusinessNumber()],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'builder_company' => $validated['builder_company'] ?? null,
            'builder_abn' => AustralianBusinessNumber::normalise($validated['builder_abn'] ?? null),
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
            'phone' => ['nullable', 'string', 'max:30'],
            'builder_company' => ['nullable', 'string', 'max:255'],
            'builder_abn' => ['nullable', 'string', 'max:20', new AustralianBusinessNumber()],
            'is_active' => ['required', 'boolean'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'builder_company' => $validated['builder_company'] ?? null,
            'builder_abn' => AustralianBusinessNumber::normalise($validated['builder_abn'] ?? null),
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
