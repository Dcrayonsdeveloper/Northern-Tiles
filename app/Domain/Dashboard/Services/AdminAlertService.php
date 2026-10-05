<?php

namespace App\Domain\Dashboard\Services;

use App\Models\ContactMessage;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

/**
 * Counts behind the dots in the admin sidebar.
 *
 * These are deliberately *unactioned work*, not "new since you last looked".
 * A seen/unseen marker needs per-admin state and goes stale the moment two
 * people share an account — and worse, it clears itself, so a pending order
 * nobody actioned stops being flagged simply because someone glanced at the
 * page. A count of what is still waiting cannot drift: it goes away when the
 * work is done and not before.
 *
 * Every count is a cheap indexed COUNT, cached briefly, and the whole thing is
 * skipped for non-admins — it is shared on every Inertia response, so it has
 * to stay close to free.
 */
class AdminAlertService
{
    /** Short enough to feel live, long enough that fast navigation is free. */
    private const TTL_SECONDS = 60;

    public function forUser(?User $user): array
    {
        if (! $user?->is_admin) {
            return [];
        }

        return Cache::remember('admin:alerts', self::TTL_SECONDS, fn () => array_filter([
            // Split by source so each sidebar item counts what its own screen
            // lists. Store > Orders defaults to website orders and Builder
            // Orders shows trade, so one combined badge would have sent an
            // admin to a list that did not contain the thing it was counting.
            //
            // Both skip abandoned card checkouts, for the same reason the
            // lists do: an order nobody completed is not work waiting.
            'orders' => Order::query()
                ->excludingAbandonedCheckouts()
                ->where('is_builder_order', false)
                ->where('status', 'pending')
                ->count(),
            'builder-orders' => Order::query()
                ->excludingAbandonedCheckouts()
                ->where('is_builder_order', true)
                ->where('status', 'pending')
                ->count(),
            'messages' => ContactMessage::query()->where('is_read', false)->count(),
            'builder-accounts' => User::query()
                ->where('is_builder', true)
                ->whereNull('builder_approved_at')
                ->count(),
        ]));
    }
}
