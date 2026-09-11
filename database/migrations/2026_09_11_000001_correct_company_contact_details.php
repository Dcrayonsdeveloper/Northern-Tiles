<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Put the real company details into the live database.
 *
 * The footer was showing "123 Business Street, City, Country". That string
 * came from DictionarySeeder, and FooterConfigService::resolveText() checks
 * the dictionary BEFORE falling back to settings — so the placeholder beat
 * the correct value that SettingsSeeder had already written. Fixing the
 * seeders only helps a fresh install; this corrects the rows already there.
 *
 * Only overwrites values that are still the known placeholders or are empty,
 * so anything an admin has deliberately set by hand is left alone.
 */
return new class extends Migration
{
    private const ADDRESS = '19/324 Settlement Road, Thomastown VIC 3074';
    private const PHONE   = '(03) 9464 6623';
    private const EMAIL   = 'info@ntiled.com.au';

    /** Values that are safe to replace — seeded placeholders, not real edits. */
    private const PLACEHOLDERS = [
        '123 Business Street, City, Country',
        '19/324 Settlement Road, Thomastown VIC 3074, Australia',
    ];

    public function up(): void
    {
        // ── Dictionary: this is the one the footer actually reads ──────────
        $rows = DB::table('dictionaries')->where('dkey', 'company.address')->get();

        foreach ($rows as $row) {
            if ($this->replaceable($row->value_text, self::ADDRESS)) {
                DB::table('dictionaries')
                    ->where('id', $row->id)
                    ->update(['value_text' => self::ADDRESS, 'updated_at' => now()]);
            }
        }

        // Nothing to update means the key was never seeded — create it, or the
        // footer falls through to whatever the settings table happens to hold.
        if ($rows->isEmpty()) {
            DB::table('dictionaries')->insert([
                'locale'     => 'en',
                'dkey'       => 'company.address',
                'value_text' => self::ADDRESS,
                'group'      => 'company',
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // ── Settings: the fallback, and what the admin screen edits ────────
        $this->setSetting('company.address', self::ADDRESS);
        $this->setSetting('company.phone', self::PHONE);
        $this->setSetting('company.email', self::EMAIL);

        // Both layers cache, and the dictionary uses rememberForever — without
        // this the rows are correct and the site still serves the placeholder.
        foreach (['company.address', 'company.phone', 'company.email'] as $key) {
            Cache::forget('settings:' . $key);
        }

        $locales = DB::table('dictionaries')->distinct()->pluck('locale');

        foreach ($locales->push('en')->unique() as $locale) {
            Cache::forget('dictionary:items:' . $locale);
            Cache::forget('dictionary:merged:' . $locale);
        }
    }

    public function down(): void
    {
        // No down path: this replaces placeholder text with the business's
        // real details. Restoring "123 Business Street" would be a regression,
        // not a rollback.
    }

    private function setSetting(string $key, string $value): void
    {
        $existing = DB::table('settings')->where('key', $key)->first();

        if (! $existing) {
            DB::table('settings')->insert([
                'key'        => $key,
                'group'      => 'company',
                'value_text' => $value,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return;
        }

        if ($this->replaceable($existing->value_text, $value)) {
            DB::table('settings')
                ->where('key', $key)
                ->update(['value_text' => $value, 'updated_at' => now()]);
        }
    }

    /** Empty, a known placeholder, or already correct — anything else is a real edit. */
    private function replaceable(?string $current, string $target): bool
    {
        $current = trim((string) $current);

        return $current === ''
            || $current === $target
            || in_array($current, self::PLACEHOLDERS, true);
    }
};
