<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('key')->comment('Unique template key e.g. abandon_1');
            $table->string('name');
            $table->string('subject');
            $table->string('subject_key')->nullable()->comment('Dictionary key for i18n');
            $table->text('preview_text')->nullable();
            $table->json('body_json')->nullable()->comment('Block-based content');
            $table->longText('body_html')->nullable()->comment('Rendered HTML');
            $table->enum('type', ['transactional', 'marketing', 'abandoned_cart', 'notification'])->default('transactional');
            $table->boolean('is_active')->default(true);
            $table->json('available_variables')->nullable()->comment('List of available merge tags');
            $table->timestamps();

            $table->unique(['vendor_id', 'key']);
            $table->index(['type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
