<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates an Australian Business Number using the ATO's published checksum,
 * so a typo'd ABN is rejected at sign-up rather than discovered later when
 * someone tries to raise a trade invoice against it.
 *
 * Algorithm (ATO): strip non-digits, require 11 digits, subtract 1 from the
 * first digit, multiply each digit by its positional weight, and the total must
 * divide evenly by 89.
 */
class AustralianBusinessNumber implements ValidationRule
{
    private const WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $digits = preg_replace('/\D/', '', (string) $value);

        if (strlen($digits) !== 11) {
            $fail('The :attribute must be 11 digits.');

            return;
        }

        $sum = 0;
        foreach (self::WEIGHTS as $i => $weight) {
            $digit = (int) $digits[$i];

            if ($i === 0) {
                $digit--;
            }

            $sum += $digit * $weight;
        }

        if ($sum % 89 !== 0) {
            $fail('The :attribute is not a valid ABN. Please check the number.');
        }
    }

    /**
     * Normalise to bare digits for storage, so lookups and duplicate checks are
     * not defeated by spacing differences.
     */
    public static function normalise(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $digits = preg_replace('/\D/', '', $value);

        return $digits === '' ? null : $digits;
    }
}
