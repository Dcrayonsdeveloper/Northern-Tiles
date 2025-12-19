<?php

namespace App\Domain\Marketing\Services;

use App\Domain\Cart\Models\Cart;
use App\Domain\Marketing\Models\AbandonedCartMessage;
use App\Domain\Marketing\Models\EmailTemplate;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

class AbandonedCartMailerService
{
    protected int $maxPerMinute = 10;
    protected int $maxPerHour = 100;

    /**
     * Send an abandoned cart email.
     */
    public function sendMessage(AbandonedCartMessage $message): bool
    {
        $cart = $message->cart;

        // Safety checks
        if (!$this->canSendMessage($message, $cart)) {
            return false;
        }

        // Rate limiting
        if (!$this->checkRateLimit($cart->vendor_id)) {
            Log::warning("Rate limit exceeded for vendor {$cart->vendor_id}");
            return false;
        }

        try {
            // Get template
            $template = $this->getTemplate($message->template_key, $cart->vendor_id);
            if (!$template) {
                $message->markAsSkipped("Template '{$message->template_key}' not found");
                return false;
            }

            // Build email data
            $emailData = $this->buildEmailData($cart, $template);

            // Send email
            $this->sendEmail($cart->email, $template, $emailData);

            // Mark as sent
            $message->markAsSent();

            Log::info("Abandoned cart email sent", [
                'message_id' => $message->id,
                'cart_id' => $cart->id,
                'email' => $cart->email,
                'step' => $message->step,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send abandoned cart email: {$e->getMessage()}", [
                'message_id' => $message->id,
                'cart_id' => $cart->id,
            ]);

            $message->markAsFailed($e->getMessage());
            return false;
        }
    }

    /**
     * Check if message can be sent.
     */
    protected function canSendMessage(AbandonedCartMessage $message, Cart $cart): bool
    {
        // Check if cart has email
        if (empty($cart->email)) {
            $message->markAsSkipped('Cart has no email');
            return false;
        }

        // Check if cart is recovered
        if ($cart->isRecovered()) {
            $message->markAsCancelled('Cart recovered');
            return false;
        }

        // Check if user unsubscribed
        if (!$cart->canReceiveMarketingEmails() && $message->flow?->respect_opt_in) {
            $message->markAsSkipped('User not opted in for marketing');
            return false;
        }

        // Check if message is still pending
        if (!$message->isPending()) {
            return false;
        }

        return true;
    }

    /**
     * Check rate limit.
     */
    protected function checkRateLimit(?int $vendorId): bool
    {
        $key = 'abandoned-cart-email:' . ($vendorId ?? 'global');

        $executed = RateLimiter::attempt(
            $key,
            $this->maxPerMinute,
            function () {
                // Rate limit check passed
            },
            60 // 1 minute decay
        );

        return $executed;
    }

    /**
     * Get email template.
     */
    protected function getTemplate(string $key, ?int $vendorId): ?EmailTemplate
    {
        // Try vendor-specific template first
        if ($vendorId) {
            $template = EmailTemplate::byKey($key)
                ->forVendor($vendorId)
                ->active()
                ->first();

            if ($template) {
                return $template;
            }
        }

        // Fall back to global template
        return EmailTemplate::byKey($key)
            ->whereNull('vendor_id')
            ->active()
            ->first();
    }

    /**
     * Build email data for template.
     */
    protected function buildEmailData(Cart $cart, EmailTemplate $template): array
    {
        $cart->load(['items.product']);

        $brandName = Setting::getValue('site.name', config('app.name'));
        $cartTotal = $cart->getSubtotal();

        // Build cart items HTML
        $cartItemsHtml = $this->buildCartItemsHtml($cart);

        return [
            'brand_name' => $brandName,
            'customer_email' => $cart->email,
            'customer_name' => $cart->customer?->name ?? 'Customer',
            'cart_url' => $cart->getRecoveryUrl(),
            'cart_items' => $cartItemsHtml,
            'cart_items_count' => $cart->getItemCount(),
            'cart_total' => number_format($cartTotal, 2),
            'unsubscribe_url' => $cart->getUnsubscribeUrl(),
        ];
    }

    /**
     * Build HTML for cart items.
     */
    protected function buildCartItemsHtml(Cart $cart): string
    {
        $html = '<table style="width:100%;border-collapse:collapse;">';
        $html .= '<tr style="border-bottom:1px solid #eee;">';
        $html .= '<th style="text-align:left;padding:8px;">Product</th>';
        $html .= '<th style="text-align:center;padding:8px;">Qty</th>';
        $html .= '<th style="text-align:right;padding:8px;">Price</th>';
        $html .= '</tr>';

        foreach ($cart->items as $item) {
            $product = $item->product;
            $imageUrl = $product?->getPrimaryImageUrl();

            $html .= '<tr style="border-bottom:1px solid #eee;">';
            $html .= '<td style="padding:8px;">';
            if ($imageUrl) {
                $html .= '<img src="' . e($imageUrl) . '" alt="" style="width:50px;height:50px;object-fit:cover;vertical-align:middle;margin-right:10px;" />';
            }
            $html .= '<span>' . e($product?->name ?? 'Product') . '</span>';
            $html .= '</td>';
            $html .= '<td style="text-align:center;padding:8px;">' . $item->quantity . '</td>';
            $html .= '<td style="text-align:right;padding:8px;">$' . number_format($item->price * $item->quantity, 2) . '</td>';
            $html .= '</tr>';
        }

        $html .= '</table>';

        return $html;
    }

    /**
     * Send the actual email.
     */
    protected function sendEmail(string $to, EmailTemplate $template, array $data): void
    {
        $subject = $template->renderSubject($data);
        $body = $template->render($data);

        Mail::send([], [], function ($message) use ($to, $subject, $body) {
            $message->to($to)
                ->subject($subject)
                ->html($this->wrapInLayout($body));
        });
    }

    /**
     * Wrap email body in a layout.
     */
    protected function wrapInLayout(string $body): string
    {
        $brandName = Setting::getValue('site.name', config('app.name'));

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
                    <tr>
                        <td style="padding:30px;text-align:center;background:#f8f8f8;border-bottom:1px solid #eee;">
                            <h1 style="margin:0;font-size:24px;color:#333;">{$brandName}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:30px;">
                            {$body}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px;text-align:center;background:#f8f8f8;border-top:1px solid #eee;font-size:12px;color:#666;">
                            <p style="margin:0;">&copy; {$brandName}. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }

    /**
     * Send test email.
     */
    public function sendTestEmail(string $to, EmailTemplate $template): bool
    {
        try {
            // Mock cart data for test
            $data = [
                'brand_name' => Setting::getValue('site.name', config('app.name')),
                'customer_email' => $to,
                'customer_name' => 'Test Customer',
                'cart_url' => url('/cart'),
                'cart_items' => '<p><em>Sample cart items would appear here</em></p>',
                'cart_items_count' => 3,
                'cart_total' => '99.99',
                'unsubscribe_url' => url('/unsubscribe'),
            ];

            $this->sendEmail($to, $template, $data);

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send test email: {$e->getMessage()}");
            return false;
        }
    }
}
