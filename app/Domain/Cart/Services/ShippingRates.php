<?php

namespace App\Domain\Cart\Services;

use App\Models\Setting;

/**
 * The delivery rate card staff set under Admin > Shipping Rates.
 *
 * One flat charge per state or territory for any order with tiles, plus the
 * flat fee for an order of nothing but samples. A state left blank has no
 * rate and its orders are quoted by the team instead -- so with nothing filled
 * in, checkout behaves exactly as it does with quoting alone.
 *
 * Kept in settings so a price change needs no deploy.
 */
class ShippingRates
{
    /** Where Northern Tile delivers, in the order checkout lists them. */
    public const STATES = [
        'ACT' => 'Australian Capital Territory',
        'NSW' => 'New South Wales',
        'NT' => 'Northern Territory',
        'QLD' => 'Queensland',
        'SA' => 'South Australia',
        'TAS' => 'Tasmania',
        'VIC' => 'Victoria',
        'WA' => 'Western Australia',
    ];

    public const SAMPLE_KEY = 'shipping.sample_flat_rate';
    public const STATES_KEY = 'shipping.state_rates';

    /** Flat charge for an order of nothing but samples. */
    public static function sampleRate(): float
    {
        return (float) Setting::getValue(self::SAMPLE_KEY, PricingService::SAMPLE_SHIPPING_FLAT);
    }

    /**
     * The charge per state code, or null where no rate is set and delivery
     * there is quoted instead.
     *
     * @return array<string, float|null>
     */
    public static function stateRates(): array
    {
        $stored = Setting::getValue(self::STATES_KEY, []);

        return self::normalise(is_array($stored) ? $stored : []);
    }

    /** @param array<string, mixed> $stateRates */
    public static function save(float $sampleRate, array $stateRates): void
    {
        Setting::query()->updateOrCreate(
            ['key' => self::SAMPLE_KEY],
            ['group' => 'shipping', 'value_text' => number_format($sampleRate, 2, '.', '')],
        );

        Setting::query()->updateOrCreate(
            ['key' => self::STATES_KEY],
            ['group' => 'shipping', 'value_text' => null, 'value_json' => self::normalise($stateRates)],
        );

        Setting::forgetCache(self::SAMPLE_KEY);
        Setting::forgetCache(self::STATES_KEY);
    }

    /**
     * Every state present exactly once, as a rounded amount or null. A blank
     * box arrives as null or "" and means "quote it", not "free".
     */
    private static function normalise(array $rates): array
    {
        $out = [];

        foreach (array_keys(self::STATES) as $code) {
            $value = $rates[$code] ?? null;
            $out[$code] = is_numeric($value) ? round((float) $value, 2) : null;
        }

        return $out;
    }
}
