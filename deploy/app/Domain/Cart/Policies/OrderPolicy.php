<?php

namespace App\Domain\Cart\Policies;

use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class OrderPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Order $order): bool
    {
        if ($user->is_admin) {
            return true;
        }

        if ($order->user_id === $user->id) {
            return true;
        }

        if ($user->is_seller && $order->seller_id === $user->id) {
            return true;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Order $order): bool
    {
        if ($user->is_admin) {
            return true;
        }

        if ($user->is_seller && $order->seller_id === $user->id) {
            return $this->canSellerUpdateStatus($order);
        }

        return false;
    }

    public function delete(User $user, Order $order): bool
    {
        return $user->is_admin;
    }

    public function cancel(User $user, Order $order): bool
    {
        if ($user->is_admin) {
            return true;
        }

        if ($order->user_id === $user->id) {
            return in_array($order->status, ['pending', 'processing']);
        }

        return false;
    }

    public function updateStatus(User $user, Order $order): bool
    {
        if ($user->is_admin) {
            return true;
        }

        if ($user->is_seller && $order->seller_id === $user->id) {
            return $this->canSellerUpdateStatus($order);
        }

        return false;
    }

    public function refund(User $user, Order $order): bool
    {
        return $user->is_admin;
    }

    protected function canSellerUpdateStatus(Order $order): bool
    {
        return in_array($order->status, ['pending', 'processing', 'shipped']);
    }
}
