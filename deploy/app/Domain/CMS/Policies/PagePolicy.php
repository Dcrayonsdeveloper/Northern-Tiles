<?php

namespace App\Domain\CMS\Policies;

use App\Domain\CMS\Models\Page;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PagePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->is_admin || $user->hasPermission('pages.view');
    }

    public function view(User $user, Page $page): bool
    {
        if ($user->is_admin) {
            return true;
        }

        if ($page->isPublished()) {
            return true;
        }

        return $user->hasPermission('pages.view');
    }

    public function create(User $user): bool
    {
        return $user->is_admin || $user->hasPermission('pages.create');
    }

    public function update(User $user, Page $page): bool
    {
        return $user->is_admin || $user->hasPermission('pages.update');
    }

    public function delete(User $user, Page $page): bool
    {
        return $user->is_admin || $user->hasPermission('pages.delete');
    }

    public function publish(User $user, Page $page): bool
    {
        return $user->is_admin || $user->hasPermission('pages.publish');
    }

    public function restore(User $user, Page $page): bool
    {
        return $user->is_admin;
    }

    public function forceDelete(User $user, Page $page): bool
    {
        return $user->is_admin;
    }
}
