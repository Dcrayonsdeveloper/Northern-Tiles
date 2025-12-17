<?php

namespace App\Domain\CMS\Policies;

use App\Domain\CMS\Models\Author;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class AuthorPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->is_admin || $user->hasPermission('authors.view');
    }

    public function view(User $user, Author $author): bool
    {
        if ($user->is_admin) {
            return true;
        }

        if ($author->user_id === $user->id) {
            return true;
        }

        return $author->is_active;
    }

    public function create(User $user): bool
    {
        return $user->is_admin || $user->hasPermission('authors.create');
    }

    public function update(User $user, Author $author): bool
    {
        if ($user->is_admin) {
            return true;
        }

        if ($author->user_id === $user->id) {
            return true;
        }

        return $user->hasPermission('authors.update');
    }

    public function delete(User $user, Author $author): bool
    {
        return $user->is_admin || $user->hasPermission('authors.delete');
    }
}
