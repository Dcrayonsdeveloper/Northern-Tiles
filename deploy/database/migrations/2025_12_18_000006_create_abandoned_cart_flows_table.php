<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('abandoned_cart_flows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name')->default('Default Flow');
            $table->boolean('is_active')->default(false);
            $table->json('delays_json')->comment('Minutes between steps e.g. [60, 1440, 4320]');
            $table->json('template_keys_json')->comment('Template keys per step e.g. ["abandon_1", "abandon_2", "abandon_3"]');
            $table->decimal('min_cart_value', 10, 2)->nullable()->comment('Minimum cart value to trigger');
            $table->integer('abandon_threshold_minutes')->default(60)->comment('Minutes of inactivity before marking abandoned');
            $table->boolean('require_email')->default(true);
            $table->boolean('respect_opt_in')->default(true);
            $table->integer('max_emails_per_cart')->default(3);
            $table->timestamps();

            $table->index(['vendor_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('abandoned_cart_flows');
    }
};
