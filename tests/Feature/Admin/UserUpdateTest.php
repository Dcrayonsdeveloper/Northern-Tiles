<?php

namespace Tests\Feature\Admin;

use App\Domain\Auth\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Admin access is the is_admin flag; the user editor shows and edits it as
 * the Administrator role. The existing admins were made by setting the flag
 * and hold no roles, so their box opened unticked, and saving the form —
 * even to fix a typo in a name — wrote is_admin = false and locked them out.
 */
class UserUpdateTest extends TestCase
{
    use RefreshDatabase;

    private Role $adminRole;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->adminRole = Role::create(['name' => 'Administrator', 'slug' => 'admin']);
    }

    /** Made the way the live admins were: the flag, and no roles. */
    private function admin(array $overrides = []): User
    {
        return User::factory()->create(array_merge(['is_admin' => true], $overrides));
    }

    public function test_the_editor_shows_an_admin_as_an_admin(): void
    {
        $other = $this->admin();

        $this->actingAs($this->admin())
            ->get(route('admin.users.edit', $other))
            ->assertInertia(fn (Assert $page) => $page->where('user.role_ids', [$this->adminRole->id]));
    }

    public function test_saving_an_admin_keeps_their_access(): void
    {
        $other = $this->admin(['name' => 'Gurpreet']);

        $this->actingAs($this->admin())
            ->put(route('admin.users.update', $other), [
                'name' => 'Gurpreet Saran',
                'email' => $other->email,
                'role_ids' => [$this->adminRole->id],
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('Gurpreet Saran', $other->fresh()->name);
        $this->assertTrue($other->fresh()->is_admin);
    }

    public function test_an_admin_cannot_remove_their_own_access(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->put(route('admin.users.update', $admin), [
                'name' => $admin->name,
                'email' => $admin->email,
                'role_ids' => [],
            ])
            ->assertSessionHasErrors('role_ids');

        $this->assertTrue($admin->fresh()->is_admin);
    }

    public function test_another_admin_can_still_be_demoted(): void
    {
        $other = $this->admin();

        $this->actingAs($this->admin())
            ->put(route('admin.users.update', $other), [
                'name' => $other->name,
                'email' => $other->email,
                'role_ids' => [],
            ])
            ->assertSessionHasNoErrors();

        $this->assertFalse($other->fresh()->is_admin);
    }
}
