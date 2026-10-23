<?php

namespace Tests\Feature\Admin;

use App\Domain\Cart\Services\ShippingRates;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Admin > Shipping Rates: one delivery charge per state for orders with
 * tiles, and the flat fee for samples. A blank state means "quote it".
 */
class ShippingRatesPageTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        // Setting keeps a static per-request cache that outlives the test.
        Setting::forgetCache(ShippingRates::SAMPLE_KEY);
        Setting::forgetCache(ShippingRates::STATES_KEY);

        parent::tearDown();
    }

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    public function test_staff_see_every_state_with_its_rate(): void
    {
        $this->withoutVite();
        ShippingRates::save(20, ['NSW' => 120]);

        $this->actingAs($this->admin())
            ->get(route('admin.shipping-rates.edit'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/ShippingRates/Edit')
                // Props arrive JSON-normalised, so 20.0 comes back as 20.
                ->where('sampleRate', fn ($rate) => (float) $rate === 20.0)
                ->where('stateRates.NSW', fn ($rate) => (float) $rate === 120.0)
                ->where('stateRates.WA', null)
                ->has('states', 8));
    }

    public function test_staff_can_set_and_clear_state_rates(): void
    {
        ShippingRates::save(20, ['WA' => 300]);

        $this->actingAs($this->admin())
            ->put(route('admin.shipping-rates.update'), [
                'sample_rate' => '22.50',
                'state_rates' => ['NSW' => '120', 'VIC' => '95.50', 'WA' => ''],
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('admin.shipping-rates.edit'));

        $rates = ShippingRates::stateRates();

        $this->assertSame(22.5, ShippingRates::sampleRate());
        $this->assertSame(120.0, $rates['NSW']);
        $this->assertSame(95.5, $rates['VIC']);
        // Clearing a box sends that state back to quoting.
        $this->assertNull($rates['WA']);
        $this->assertNull($rates['QLD']);
    }

    public function test_a_negative_rate_is_refused(): void
    {
        $this->actingAs($this->admin())
            ->put(route('admin.shipping-rates.update'), [
                'sample_rate' => '20',
                'state_rates' => ['NSW' => '-5'],
            ])
            ->assertSessionHasErrors('state_rates.NSW');

        $this->assertNull(ShippingRates::stateRates()['NSW']);
    }

    public function test_only_admins_can_change_rates(): void
    {
        $this->actingAs(User::factory()->create())
            ->put(route('admin.shipping-rates.update'), ['sample_rate' => '0'])
            ->assertForbidden();

        $this->assertSame(20.0, ShippingRates::sampleRate());
    }
}
