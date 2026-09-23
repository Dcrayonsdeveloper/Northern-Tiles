<?php

/**
 * Turns abandoned-cart tracking on.
 *
 * Three things were missing, and all three were required before a single row
 * could appear on the admin screen:
 *   1. no flow existed, so detection returned at the first line
 *   2. carts never recorded an email
 *   3. carts never recorded last_activity_at
 *
 * Existing carts are backfilled from the account they belong to and from
 * updated_at, so carts already sitting in the database become visible instead
 * of only counting from today.
 */

use App\Domain\Cart\Models\Cart;
use App\Domain\Marketing\Models\AbandonedCartFlow;
use App\Domain\Marketing\Services\AbandonedCartService;

$dry = (bool) getenv('DRY_RUN');

// ── 1. a flow to detect against ─────────────────────────────────────────
$flow = AbandonedCartFlow::where('name', 'Default Abandoned Cart Flow')->first();

if (! $flow && ! $dry) {
    $defaults = AbandonedCartFlow::getDefaultFlow();
    // Active, and not gated on a marketing opt-in nobody has ticked — the
    // screen is meant to show carts, and opt-in only governs emailing.
    $defaults['is_active'] = true;
    $defaults['respect_opt_in'] = false;
    $flow = AbandonedCartFlow::create($defaults);
}

echo 'flow: ' . ($flow ? "#{$flow->id} {$flow->name} (active=" . ($flow->is_active ? 'yes' : 'no')
    . ", threshold={$flow->abandon_threshold_minutes}m)" : 'would create') . "\n";

// ── 2. backfill email + activity on carts that already exist ────────────
$fixedEmail = 0;
$fixedActivity = 0;

Cart::with('user')->has('items')->chunkById(200, function ($carts) use (&$fixedEmail, &$fixedActivity, $dry) {
    foreach ($carts as $cart) {
        $updates = [];

        if (! $cart->email && $cart->user?->email) {
            $updates['email'] = $cart->user->email;
            $fixedEmail++;
        }

        if (! $cart->last_activity_at) {
            $updates['last_activity_at'] = $cart->updated_at ?? $cart->created_at ?? now();
            $fixedActivity++;
        }

        if ($updates && ! $dry) {
            $cart->forceFill($updates)->save();
        }
    }
});

echo "backfilled email on {$fixedEmail} carts, last_activity_at on {$fixedActivity}\n";

// ── 3. run detection now rather than waiting for the scheduler ──────────
if (! $dry) {
    $marked = app(AbandonedCartService::class)->detectAbandonedCarts();
    echo "detection marked: {$marked}\n";
}

echo 'carts now abandoned: ' . Cart::whereNotNull('abandoned_at')->count() . "\n";
echo 'carts with items:    ' . Cart::has('items')->count() . "\n";
echo 'with an email:       ' . Cart::has('items')->whereNotNull('email')->count() . "\n";
