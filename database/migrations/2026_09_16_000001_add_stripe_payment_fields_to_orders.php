<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Every step is guarded so the migration can be re-run safely. The first
     * attempt added the columns and then aborted on an index that the original
     * orders migration had already created, leaving the table half-changed and
     * the migration unrecorded — re-running an unguarded version would just
     * fail again on the columns that now exist.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Stripe's id for the PaymentIntent behind this order.
            if (! Schema::hasColumn('orders', 'stripe_payment_intent_id')) {
                $table->string('stripe_payment_intent_id')->nullable()->after('payment_status');
            }

            // Kept separately from the intent id: an intent can be created,
            // abandoned and recreated, but a charge is the money actually
            // taken, and it is what refunds are issued against.
            if (! Schema::hasColumn('orders', 'stripe_charge_id')) {
                $table->string('stripe_charge_id')->nullable()->after('stripe_payment_intent_id');
            }

            // When payment actually succeeded. `payment_status` says what the
            // order is; this says when it became that, which is what finance
            // reconciles against and what `created_at` cannot tell you for an
            // order paid minutes after it was placed.
            if (! Schema::hasColumn('orders', 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('stripe_charge_id');
            }
        });

        // Unique, so a retry or a replayed webhook can never produce two paid
        // orders for one intent — the database refuses it rather than trusting
        // application code to be careful.
        if (! $this->indexExists('orders', 'orders_stripe_payment_intent_id_unique')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->unique('stripe_payment_intent_id');
            });
        }

        // `orders.currency` was created defaulting to 'INR' — a leftover from
        // the template this project started from. Every live code path sets
        // 'AUD' explicitly (Cart defaults, PricingService, CartController), so
        // no existing row is wrong. But once Stripe charges in the order's
        // currency, any path that ever forgets to set it would bill Indian
        // Rupees instead of Australian Dollars: at roughly A$1 = ₹55, a A$500
        // order would take about A$9. Correcting the default removes the
        // possibility rather than relying on every future caller remembering.
        DB::statement("ALTER TABLE `orders` ALTER COLUMN `currency` SET DEFAULT 'AUD'");
    }

    public function down(): void
    {
        if ($this->indexExists('orders', 'orders_stripe_payment_intent_id_unique')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropUnique('orders_stripe_payment_intent_id_unique');
            });
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(array_values(array_filter(
                ['stripe_payment_intent_id', 'stripe_charge_id', 'paid_at'],
                fn (string $column) => Schema::hasColumn('orders', $column)
            )));
        });

        DB::statement("ALTER TABLE `orders` ALTER COLUMN `currency` SET DEFAULT 'INR'");
    }

    private function indexExists(string $table, string $index): bool
    {
        return DB::table('information_schema.STATISTICS')
            ->where('TABLE_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', $table)
            ->where('INDEX_NAME', $index)
            ->exists();
    }
};
