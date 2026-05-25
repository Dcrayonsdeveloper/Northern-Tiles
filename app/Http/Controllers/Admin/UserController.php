<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::query()
            ->orderByDesc('id')
            ->paginate(20)
            ->through(fn (User $user) => [
                'id'                => $user->id,
                'name'              => $user->name,
                'email'             => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'is_admin'          => (bool) $user->is_admin,
                'is_active'         => (bool) $user->is_active,
                'created_at'        => $user->created_at,
            ])
            ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
        ]);
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Admin/Users/Edit', [
            'user' => [
                'id'                => $user->id,
                'name'              => $user->name,
                'email'             => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'is_admin'          => (bool) $user->is_admin,
                'is_active'         => (bool) $user->is_active,
            ],
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'is_admin' => ['required', 'boolean'],
        ]);

        $user->update([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'is_admin' => (bool) $validated['is_admin'],
        ]);

        return redirect()
            ->route('admin.users.edit', $user->id)
            ->with('success', 'User updated successfully.');
    }

    public function toggleActive(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot change the active status of your own account.');
        }

        $user->update(['is_active' => ! $user->is_active]);

        $label = $user->is_active ? 'activated' : 'deactivated';

        return redirect()
            ->route('admin.users.edit', $user->id)
            ->with('success', "Account {$label} successfully.");
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete(); // soft delete — record remains in DB with deleted_at set

        return redirect()
            ->route('admin.users.index')
            ->with('success', "User \"{$user->name}\" deleted successfully.");
    }
}
