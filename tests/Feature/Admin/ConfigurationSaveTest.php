<?php

namespace Tests\Feature\Admin;

use App\Domain\Settings\Services\SettingService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ConfigurationSaveTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    public function test_saving_the_configuration_keeps_the_menus(): void
    {
        $settings = app(SettingService::class);
        $settings->setJson('menu.footer_shop', ['items' => [['label' => 'All Products', 'url' => '/shop']]], 'menus');

        // The page has no Menus tab, so it never sends menu_* fields; every
        // save used to write all six menus back as empty.
        $this->actingAs($this->admin())
            ->post(route('admin.configuration.update'), ['site_title' => 'Northern TILE Distributors'])
            ->assertSessionHasNoErrors();

        $this->assertSame('All Products', $settings->getJson('menu.footer_shop')['items'][0]['label'] ?? null);
    }

    public function test_the_footer_shows_the_address_saved_in_configuration(): void
    {
        $this->withoutVite();
        // The 2026-09-11 migration adds this dictionary row, which the footer
        // read in preference to the setting the admin edits.
        $this->assertDatabaseHas('dictionaries', ['locale' => 'en', 'dkey' => 'company.address', 'is_active' => true]);

        $this->actingAs($this->admin())->post(route('admin.configuration.update'), [
            'site_title' => 'Northern TILE Distributors',
            'company_address' => '7 Example Street, Epping VIC 3076',
        ]);

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('footerConfig.brand.address', '7 Example Street, Epping VIC 3076'));
    }
}
