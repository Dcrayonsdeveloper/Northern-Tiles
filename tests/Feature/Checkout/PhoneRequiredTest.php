<?php

namespace Tests\Feature\Checkout;

use App\Domain\Cart\Services\CheckoutService;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * The phone field is marked required on both checkout forms, and the server
 * has to agree — otherwise anyone posting around the browser check still
 * places an order nobody can ring about.
 */
class PhoneRequiredTest extends TestCase
{
    private function payload(?string $phone): array
    {
        return [
            'contact' => ['email' => 'pat@example.test', 'phone' => $phone],
            'shipping_address' => [
                'name' => 'Pat Morrow', 'address_line_1' => '1 Test St',
                'city' => 'Melbourne', 'state' => 'VIC',
                'postal_code' => '3000', 'country' => 'Australia',
            ],
            'payment_method' => CheckoutService::PAYMENT_CARD,
            'billing_same_as_shipping' => true,
        ];
    }

    private function validate(array $data, string $channel)
    {
        $rules = app(CheckoutService::class)->validateCheckoutData($data, true, $channel);

        return Validator::make($data, $rules);
    }

    public function test_checkout_without_a_phone_is_rejected(): void
    {
        foreach (['retail', 'trade'] as $channel) {
            foreach ([null, ''] as $phone) {
                $validator = $this->validate($this->payload($phone), $channel);

                $this->assertTrue($validator->fails(), "{$channel} accepted phone " . var_export($phone, true));
                $this->assertArrayHasKey('contact.phone', $validator->errors()->toArray());
            }
        }
    }

    public function test_checkout_with_a_phone_passes(): void
    {
        $validator = $this->validate($this->payload('0412 345 678'), 'retail');

        $this->assertFalse($validator->fails(), $validator->errors()->toJson());
    }
}
