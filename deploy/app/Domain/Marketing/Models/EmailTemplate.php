<?php

namespace App\Domain\Marketing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailTemplate extends Model
{
    protected $fillable = [
        'vendor_id',
        'key',
        'name',
        'subject',
        'subject_key',
        'preview_text',
        'body_json',
        'body_html',
        'type',
        'is_active',
        'available_variables',
    ];

    protected $casts = [
        'body_json' => 'array',
        'available_variables' => 'array',
        'is_active' => 'boolean',
    ];

    public const TYPE_TRANSACTIONAL = 'transactional';
    public const TYPE_MARKETING = 'marketing';
    public const TYPE_ABANDONED_CART = 'abandoned_cart';
    public const TYPE_NOTIFICATION = 'notification';

    // Default abandoned cart variables
    public const ABANDONED_CART_VARIABLES = [
        '{{brand_name}}' => 'Your store/brand name',
        '{{customer_email}}' => 'Customer email address',
        '{{customer_name}}' => 'Customer name if available',
        '{{cart_url}}' => 'URL to recover the cart',
        '{{cart_items}}' => 'HTML list of cart items',
        '{{cart_items_count}}' => 'Number of items in cart',
        '{{cart_total}}' => 'Cart total amount',
        '{{unsubscribe_url}}' => 'Unsubscribe link',
    ];

    // Relationships
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeAbandonedCart($query)
    {
        return $query->where('type', self::TYPE_ABANDONED_CART);
    }

    public function scopeForVendor($query, ?int $vendorId)
    {
        if ($vendorId) {
            return $query->where('vendor_id', $vendorId);
        }
        return $query->whereNull('vendor_id');
    }

    public function scopeByKey($query, string $key)
    {
        return $query->where('key', $key);
    }

    // Helpers
    public function getDisplaySubject(): string
    {
        if ($this->subject_key) {
            return d($this->subject_key) ?? $this->subject;
        }
        return $this->subject;
    }

    public function render(array $data = []): string
    {
        $html = $this->body_html ?? $this->renderFromJson();

        foreach ($data as $key => $value) {
            $html = str_replace('{{' . $key . '}}', $value, $html);
        }

        return $html;
    }

    public function renderSubject(array $data = []): string
    {
        $subject = $this->getDisplaySubject();

        foreach ($data as $key => $value) {
            $subject = str_replace('{{' . $key . '}}', $value, $subject);
        }

        return $subject;
    }

    protected function renderFromJson(): string
    {
        if (empty($this->body_json)) {
            return '';
        }

        // Simple block renderer - can be extended
        $html = '';
        foreach ($this->body_json as $block) {
            $html .= $this->renderBlock($block);
        }

        return $html;
    }

    protected function renderBlock(array $block): string
    {
        return match ($block['type'] ?? 'text') {
            'heading' => sprintf('<h%d>%s</h%d>', $block['level'] ?? 2, $block['content'] ?? '', $block['level'] ?? 2),
            'paragraph', 'text' => sprintf('<p>%s</p>', $block['content'] ?? ''),
            'button' => sprintf(
                '<a href="%s" style="display:inline-block;padding:12px 24px;background:%s;color:%s;text-decoration:none;border-radius:4px;">%s</a>',
                $block['url'] ?? '#',
                $block['bg_color'] ?? '#000',
                $block['text_color'] ?? '#fff',
                $block['label'] ?? 'Click Here'
            ),
            'image' => sprintf('<img src="%s" alt="%s" style="max-width:100%%;" />', $block['src'] ?? '', $block['alt'] ?? ''),
            'divider' => '<hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />',
            'spacer' => sprintf('<div style="height:%dpx;"></div>', $block['height'] ?? 20),
            'html' => $block['content'] ?? '',
            default => '',
        };
    }

    public static function getTypes(): array
    {
        return [
            self::TYPE_TRANSACTIONAL => 'Transactional',
            self::TYPE_MARKETING => 'Marketing',
            self::TYPE_ABANDONED_CART => 'Abandoned Cart',
            self::TYPE_NOTIFICATION => 'Notification',
        ];
    }
}
