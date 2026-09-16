<?php

namespace App\Console\Commands;

use App\Domain\Auth\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Support\Facades\Validator;

/**
 * Creates (or repairs) an account that can sign in to /admin.
 *
 * Admin access is a single flag — App\Http\Middleware\AdminMiddleware aborts
 * with 403 unless $user->is_admin — so an account can look perfectly valid and
 * still bounce off the admin panel. This command is the one place that gets
 * every part right at once: the flag, a verified email, an active account, and
 * the admin role if the roles table carries one.
 *
 * On an email that already exists it updates in place rather than failing, so
 * it doubles as a password reset for a locked-out admin. That is destructive
 * in the small, so it asks first unless --force is given.
 */
class CreateAdminUserCommand extends Command
{
    protected $signature = 'admin:create
                            {email : Email address to sign in with}
                            {--name= : Display name (defaults to the part before the @)}
                            {--password= : Password; omit to be prompted without echo}
                            {--force : Update an existing account without confirming}';

    protected $description = 'Create an admin user for /admin, or reset an existing one';

    public function handle(): int
    {
        $email = trim((string) $this->argument('email'));
        $password = (string) ($this->option('password') ?? '');

        if ($password === '') {
            $password = (string) $this->secret('Password');
        }

        $validator = Validator::make(
            ['email' => $email, 'password' => $password],
            ['email' => ['required', 'email'], 'password' => ['required', PasswordRule::min(8)]],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        // withTrashed: a soft-deleted admin still owns the email, and a plain
        // create() would hit the unique index with a confusing SQL error.
        $existing = User::withTrashed()->where('email', $email)->first();

        if ($existing && ! $this->option('force')) {
            $this->warn("{$email} already exists (id {$existing->id})" . ($existing->trashed() ? ', soft-deleted' : ''));

            if (! $this->confirm('Update it — new password, admin flag, restored if deleted?', false)) {
                $this->line('Nothing changed.');

                return self::SUCCESS;
            }
        }

        $name = (string) ($this->option('name') ?? '');

        if ($name === '') {
            $name = $existing->name ?? ucfirst(strtok($email, '@'));
        }

        $user = $existing ?? new User();

        if ($user->trashed()) {
            $user->restore();
        }

        $user->fill([
            'name'      => $name,
            'email'     => $email,
            // No Hash::make here: the User model casts password to 'hashed',
            // so hashing first would store a hash of a hash and never match.
            'password'  => $password,
            'is_admin'  => true,
            'is_active' => true,
        ]);
        $user->email_verified_at = $user->email_verified_at ?? now();
        $user->save();

        // Belt and braces: the middleware only reads is_admin, but parts of the
        // dashboard branch on the role, and a role-less admin sees a thin panel.
        $role = Role::where('slug', 'admin')->orWhere('name', 'Admin')->first();

        if ($role && ! $user->roles()->where('roles.id', $role->id)->exists()) {
            $user->roles()->attach($role->id);
            $this->line("  attached role: {$role->name}");
        }

        $this->newLine();
        $this->info(($existing ? 'Updated' : 'Created') . " admin account");
        $this->table(['Field', 'Value'], [
            ['id', $user->id],
            ['name', $user->name],
            ['email', $user->email],
            ['is_admin', $user->is_admin ? 'true' : 'false'],
            ['is_active', $user->is_active ? 'true' : 'false'],
            ['verified', $user->email_verified_at ? 'yes' : 'no'],
            ['password works', Hash::check($password, $user->fresh()->password) ? 'YES' : 'NO'],
        ]);

        return self::SUCCESS;
    }
}
