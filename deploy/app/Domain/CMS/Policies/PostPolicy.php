<?php

namespace App\Domain\CMS\Policies;

use App\Domain\CMS\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PostPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->is_admin || $user->hasPermission('posts.view');
    }

    public function view(User $user, Post $post): bool
    {
        if ($user->is_admin) {
            return true;
        }

        if ($post->isPublished()) {
            return true;
        }

        if ($post->author_id && $user->author?->id === $post->author_id) {
            return true;
        }

        return $user->hasPermission('posts.view');
    }

    public function create(User $user): bool
    {
        return $user->is_admin || $user->hasPermission('posts.create');
    }

    public function update(User $user, Post $post): bool
    {
        if ($user->is_admin) {
            return true;
        }

        if ($post->author_id && $user->author?->id === $post->author_id) {
            return true;
        }

        return $user->hasPermission('posts.update');
    }

    public function delete(User $user, Post $post): bool
    {
        return $user->is_admin || $user->hasPermission('posts.delete');
    }

    public function publish(User $user, Post $post): bool
    {
        return $user->is_admin || $user->hasPermission('posts.publish');
    }

    public function restore(User $user, Post $post): bool
    {
        return $user->is_admin;
    }

    public function forceDelete(User $user, Post $post): bool
    {
        return $user->is_admin;
    }
}
