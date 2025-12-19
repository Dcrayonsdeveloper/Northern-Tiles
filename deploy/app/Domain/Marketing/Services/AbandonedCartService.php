<?php

namespace App\Domain\Marketing\Services;

use App\Domain\Cart\Models\Cart;
use App\Domain\Marketing\Models\AbandonedCartFlow;
use App\Domain\Marketing\Models\AbandonedCartMessage;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AbandonedCartService
{
    /**
     * Detect and mark abandoned carts.
     */
    public function detectAbandonedCarts(?int $vendorId = null): int
    {
        // Get active flows
        $flows = AbandonedCartFlow::active()
            ->when($vendorId !== null, fn($q) => $q->forVendor($vendorId))
            ->get();

        if ($flows->isEmpty()) {
            Log::info('No active abandoned cart flows found');
            return 0;
        }

        $totalMarked = 0;

        foreach ($flows as $flow) {
            $marked = $this->detectAbandonedCartsForFlow($flow);
            $totalMarked += $marked;
        }

        Log::info("Detected {$totalMarked} abandoned carts");

        return $totalMarked;
    }

    /**
     * Detect abandoned carts for a specific flow.
     */
    protected function detectAbandonedCartsForFlow(AbandonedCartFlow $flow): int
    {
        $threshold = $flow->getAbandonThreshold();

        $query = Cart::eligibleForAbandonment($threshold)
            ->when($flow->vendor_id, fn($q) => $q->where('vendor_id', $flow->vendor_id));

        // Apply minimum cart value filter
        if ($flow->min_cart_value) {
            $query->whereHas('items', function ($q) use ($flow) {
                $q->havingRaw('SUM(price * quantity) >= ?', [$flow->min_cart_value]);
            });
        }

        // Apply marketing opt-in filter if required
        if ($flow->respect_opt_in) {
            $query->marketingOptedIn();
        }

        $carts = $query->get();
        $marked = 0;

        foreach ($carts as $cart) {
            try {
                $this->markCartAsAbandoned($cart, $flow);
                $marked++;
            } catch (\Exception $e) {
                Log::error("Failed to mark cart {$cart->id} as abandoned: {$e->getMessage()}");
            }
        }

        return $marked;
    }

    /**
     * Mark a cart as abandoned and schedule messages.
     */
    public function markCartAsAbandoned(Cart $cart, AbandonedCartFlow $flow): void
    {
        DB::transaction(function () use ($cart, $flow) {
            // Mark cart as abandoned
            $cart->markAsAbandoned();

            // Schedule messages for each step
            $this->scheduleMessagesForCart($cart, $flow);
        });

        Log::info("Cart {$cart->id} marked as abandoned, messages scheduled");
    }

    /**
     * Schedule abandoned cart messages for a cart.
     */
    protected function scheduleMessagesForCart(Cart $cart, AbandonedCartFlow $flow): void
    {
        $delays = $flow->getDelays();
        $templateKeys = $flow->getTemplateKeys();
        $maxEmails = $flow->max_emails_per_cart;

        for ($step = 1; $step <= min(count($delays), $maxEmails); $step++) {
            $delay = $delays[$step - 1] ?? null;
            $templateKey = $templateKeys[$step - 1] ?? null;

            if ($delay === null || $templateKey === null) {
                continue;
            }

            $scheduledAt = $flow->getScheduledTimeForStep($step, $cart->abandoned_at);

            AbandonedCartMessage::create([
                'cart_id' => $cart->id,
                'flow_id' => $flow->id,
                'step' => $step,
                'template_key' => $templateKey,
                'status' => AbandonedCartMessage::STATUS_SCHEDULED,
                'scheduled_at' => $scheduledAt,
            ]);
        }
    }

    /**
     * Get messages ready to be sent.
     */
    public function getMessagesReadyToSend(?int $vendorId = null, int $limit = 100): Collection
    {
        return AbandonedCartMessage::readyToSend()
            ->with(['cart', 'flow'])
            ->when($vendorId !== null, function ($q) use ($vendorId) {
                $q->whereHas('cart', fn($sub) => $sub->where('vendor_id', $vendorId));
            })
            ->limit($limit)
            ->get();
    }

    /**
     * Cancel pending messages for a cart (e.g., when recovered).
     */
    public function cancelPendingMessages(Cart $cart, string $reason = 'Cart recovered'): int
    {
        return $cart->abandonedCartMessages()
            ->pending()
            ->update([
                'status' => AbandonedCartMessage::STATUS_CANCELLED,
                'error_text' => $reason,
            ]);
    }

    /**
     * Get abandoned carts for admin view.
     */
    public function getAbandonedCarts(array $filters = [], int $perPage = 20)
    {
        $query = Cart::abandoned()
            ->with(['items.product', 'customer', 'abandonedCartMessages'])
            ->withCount('items');

        // Apply filters
        if (!empty($filters['vendor_id'])) {
            $query->where('vendor_id', $filters['vendor_id']);
        }

        if (!empty($filters['search'])) {
            $query->where('email', 'like', "%{$filters['search']}%");
        }

        if (!empty($filters['status'])) {
            switch ($filters['status']) {
                case 'pending':
                    $query->whereHas('abandonedCartMessages', fn($q) => $q->pending());
                    break;
                case 'sent':
                    $query->whereHas('abandonedCartMessages', fn($q) => $q->sent());
                    break;
                case 'recovered':
                    $query->recovered();
                    break;
            }
        }

        if (!empty($filters['date_from'])) {
            $query->where('abandoned_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('abandoned_at', '<=', $filters['date_to']);
        }

        return $query->orderByDesc('abandoned_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get statistics for abandoned carts.
     */
    public function getStatistics(?int $vendorId = null, ?string $period = '30d'): array
    {
        $periodDays = match ($period) {
            '7d' => 7,
            '30d' => 30,
            '90d' => 90,
            default => 30,
        };

        $startDate = now()->subDays($periodDays);

        $baseQuery = Cart::where('abandoned_at', '>=', $startDate)
            ->when($vendorId, fn($q) => $q->where('vendor_id', $vendorId));

        $totalAbandoned = (clone $baseQuery)->count();
        $totalRecovered = (clone $baseQuery)->recovered()->count();
        $recoveryRate = $totalAbandoned > 0 ? round(($totalRecovered / $totalAbandoned) * 100, 1) : 0;

        // Calculate total value
        $abandonedValue = Cart::abandoned()
            ->where('abandoned_at', '>=', $startDate)
            ->when($vendorId, fn($q) => $q->where('vendor_id', $vendorId))
            ->withSum('items', DB::raw('price * quantity'))
            ->get()
            ->sum('items_sum_price * quantity');

        // Get message stats
        $messageStats = AbandonedCartMessage::where('created_at', '>=', $startDate)
            ->when($vendorId, function ($q) use ($vendorId) {
                $q->whereHas('cart', fn($sub) => $sub->where('vendor_id', $vendorId));
            })
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return [
            'total_abandoned' => $totalAbandoned,
            'total_recovered' => $totalRecovered,
            'recovery_rate' => $recoveryRate,
            'abandoned_value' => $abandonedValue,
            'messages_sent' => $messageStats[AbandonedCartMessage::STATUS_SENT] ?? 0,
            'messages_pending' => ($messageStats[AbandonedCartMessage::STATUS_QUEUED] ?? 0) +
                ($messageStats[AbandonedCartMessage::STATUS_SCHEDULED] ?? 0),
            'messages_failed' => $messageStats[AbandonedCartMessage::STATUS_FAILED] ?? 0,
            'period' => $period,
        ];
    }
}
