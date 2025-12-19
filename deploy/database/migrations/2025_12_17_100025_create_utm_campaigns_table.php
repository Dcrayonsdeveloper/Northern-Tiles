<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utm_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name', 191);
            $table->string('utm_source', 100);
            $table->string('utm_medium', 100);
            $table->string('utm_campaign', 100);
            $table->string('utm_term', 100)->nullable();
            $table->string('utm_content', 100)->nullable();
            $table->text('landing_url');
            $table->text('generated_url')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('click_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('created_by');
            $table->index('is_active');
            $table->index('utm_source');
            $table->index('utm_campaign');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utm_campaigns');
    }
};
