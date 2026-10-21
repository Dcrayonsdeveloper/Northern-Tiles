<?php

namespace App\Http\Controllers\Admin;

use App\Domain\Auth\Models\Role;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::query()
            ->with('roles:id,name,slug')
            ->orderByDesc('id')
            ->paginate(20)
            ->through(fn (User $user) => [
                'id'                => $user->id,
                'name'              => $user->name,
                'email'             => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'is_admin'          => (bool) $user->is_admin,
                'is_builder'        => (bool) $user->is_builder,
                'is_active'         => (bool) $user->is_active,
                'roles'             => $user->roles->map(fn ($r) => ['id' => $r->id, 'name' => $r->name, 'slug' => $r->slug]),
                'created_at'        => $user->created_at,
            ])
            ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
        ]);
    }

    public function create(): Response
    {
        $roles = Role::orderBy('name')->get(['id', 'name', 'slug', 'description']);

        return Inertia::render('Admin/Users/Create', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role_id'  => ['nullable', 'exists:roles,id'],
        ]);

        // Determine is_admin based on role
        $isAdmin = false;
        if (!empty($validated['role_id'])) {
            $role = Role::find($validated['role_id']);
            $isAdmin = $role && $role->slug === 'admin';
        }

        $user = User::create([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'password'  => $validated['password'],
            'is_admin'  => $isAdmin,
            'is_active' => true,
        ]);

        // Assign role if selected
        if (!empty($validated['role_id'])) {
            $user->roles()->sync([$validated['role_id']]);
        }

        // email_verified_at is not mass-assignable, so set it explicitly.
        $user->forceFill(['email_verified_at' => now()])->save();

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User created successfully.');
    }

    public function edit(User $user): Response
    {
        $user->load('roles:id,name,slug');
        $roles = Role::orderBy('name')->get(['id', 'name', 'slug', 'description']);

        // is_admin is what grants access; the admin role is how this form
        // shows and edits it. The existing admins were made by setting the
        // flag and hold no roles, so their box opened unticked — and saving
        // the form unchanged wrote is_admin = false and locked them out.
        $roleIds = $user->roles->pluck('id');
        $adminRole = $roles->firstWhere('slug', 'admin');
        if ($user->is_admin && $adminRole) {
            $roleIds->push($adminRole->id);
        }

        return Inertia::render('Admin/Users/Edit', [
            'user' => [
                'id'                => $user->id,
                'name'              => $user->name,
                'email'             => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'is_admin'          => (bool) $user->is_admin,
                'is_active'         => (bool) $user->is_active,
                'role_ids'          => $roleIds->unique()->values()->toArray(),
            ],
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['exists:roles,id'],
        ]);

        // Determine is_admin based on roles. With no admin role to read it
        // from, the flag is left as it is rather than revoked.
        $adminRole = Role::where('slug', 'admin')->first();
        $isAdmin = $adminRole
            ? in_array($adminRole->id, $validated['role_ids'] ?? [])
            : (bool) $user->is_admin;

        // Unticking your own admin box took effect on the redirect — straight
        // into a 403, with no way back in to undo it.
        if ($user->is($request->user()) && $user->is_admin && ! $isAdmin) {
            throw ValidationException::withMessages([
                'role_ids' => 'You cannot remove your own administrator access.',
            ]);
        }

        $user->update([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'is_admin' => $isAdmin,
        ]);

        // Sync roles
        $user->roles()->sync($validated['role_ids'] ?? []);

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
