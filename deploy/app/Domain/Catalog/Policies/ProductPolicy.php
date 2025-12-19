<?php

namespace App\Domain\Catalog\Policies;

use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ProductPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Product $product): bool
    {
        if ($user->is_admin) {
            return true;
        }

        if ($user->is_seller && $product->seller_id === $user->id) {
            return true;
        }

        return $product->is_active;
    }

    public function create(User $user): bool
    {
        return $user->is_admin || $user->isApprovedSeller();
    }

    public function update(User $user, Product $product): bool
    {
        if ($user->is_admin) {
            return true;
        }

        return $user->is_seller && $product->seller_id === $user->id;
    }

    public function delete(User $user, Product $product): bool
    {
        if ($user->is_admin) {
            return true;
        }

        return $user->is_seller && $product->seller_id === $user->id;
    }

    public function restore(User $user, Product $product): bool
    {
        return $user->is_admin;
    }

    public function forceDelete(User $user, Product $product): bool
    {
        return $user->is_admin;
    }

    public function manageVariants(User $user, Product $product): bool
    {
        return $this->update($user, $product);
    }

    public function manageTags(User $user, Product $product): bool
    {
        return $this->update($user, $product);
    }

    public function manageContentBlocks(User $user, Product $product): bool
    {
        return $this->update($user, $product);
    }
}
