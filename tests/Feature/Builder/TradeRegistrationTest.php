<?php

namespace Tests\Feature\Builder;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * The trade application is the only route into builder pricing, so the details
 * an admin needs in order to approve it — company, ABN and a contactable phone
 * number — are all compulsory, and the ABN has to be a real one.
 */
class TradeRegistrationTest extends TestCase
{
    use RefreshDatabase;

    /** A genuine ABN by the ATO checksum, used as the happy-path fixture. */
    private const VALID_ABN = '51 824 753 556';

    public function test_the_application_form_renders(): void
    {
        $this->get('/builder/register')->assertStatus(200);
    }

    public function test_a_guest_can_apply_and_the_abn_and_phone_are_stored(): void
    {
        $this->post('/builder/register', [
            'name' => 'Dara Whitlock',
            'builder_company' => 'Northside Constructions Pty Ltd',
            'builder_abn' => self::VALID_ABN,
            'email' => 'dara@northside.test',
            'phone' => '03 9464 6623',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('builder.pending'));

        $user = User::where('email', 'dara@northside.test')->firstOrFail();

        $this->assertSame('Northside Constructions Pty Ltd', $user->builder_company);
        // Stored bare, so a search does not depend on how it was typed.
        $this->assertSame('51824753556', $user->builder_abn);
        $this->assertSame('03 9464 6623', $user->phone);
        $this->assertTrue($user->is_builder);
        $this->assertNull($user->builder_approved_at, 'A new application must start pending.');
    }

    #[DataProvider('requiredFieldProvider')]
    public function test_every_field_is_required(string $missing): void
    {
        $payload = [
            'name' => 'Dara Whitlock',
            'builder_company' => 'Northside Constructions Pty Ltd',
            'builder_abn' => self::VALID_ABN,
            'email' => 'dara@northside.test',
            'phone' => '03 9464 6623',
            'password' => 'password',
            'password_confirmation' => 'password',
        ];

        unset($payload[$missing]);

        $this->post('/builder/register', $payload)->assertSessionHasErrors($missing);
        $this->assertDatabaseCount('users', 0);
    }

    public static function requiredFieldProvider(): array
    {
        return [
            'name' => ['name'],
            'company' => ['builder_company'],
            'abn' => ['builder_abn'],
            'email' => ['email'],
            'phone' => ['phone'],
            'password' => ['password'],
        ];
    }

    public function test_an_abn_that_fails_the_checksum_is_rejected(): void
    {
        $this->post('/builder/register', [
            'name' => 'Dara Whitlock',
            'builder_company' => 'Northside Constructions Pty Ltd',
            'builder_abn' => '12345678901',
            'email' => 'dara@northside.test',
            'phone' => '03 9464 6623',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors('builder_abn');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_an_existing_customer_upgrading_must_also_supply_an_abn(): void
    {
        $user = User::factory()->create(['is_builder' => false]);

        $this->actingAs($user)
            ->post('/builder/register', ['builder_company' => 'Northside Constructions Pty Ltd'])
            ->assertSessionHasErrors(['builder_abn', 'phone']);

        $this->assertFalse($user->fresh()->is_builder);
    }

    public function test_an_existing_customer_can_upgrade_with_full_details(): void
    {
        $user = User::factory()->create(['is_builder' => false]);

        $this->actingAs($user)->post('/builder/register', [
            'builder_company' => 'Northside Constructions Pty Ltd',
            'builder_abn' => self::VALID_ABN,
            'phone' => '03 9464 6623',
        ])->assertRedirect(route('builder.pending'));

        $user->refresh();

        $this->assertTrue($user->is_builder);
        $this->assertSame('51824753556', $user->builder_abn);
        $this->assertNull($user->builder_approved_at);
    }
}
