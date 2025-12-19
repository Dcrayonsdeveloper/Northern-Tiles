<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->string('title_key')->nullable()->comment('Dictionary key for i18n');
            $table->string('handle')->unique();
            $table->text('description')->nullable();
            $table->string('description_key')->nullable();
            $table->string('image_path')->nullable();
            $table->enum('type', ['manual', 'automated'])->default('manual');
            $table->json('rules_json')->nullable()->comment('Automated collection rules');
            $table->enum('sort_mode', ['manual', 'newest', 'oldest', 'price_asc', 'price_desc', 'best_selling', 'discount_desc', 'title_asc', 'title_desc'])->default('manual');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->timestamp('last_indexed_at')->nullable();
            $table->timestamps();

            $table->index(['type', 'is_active']);
            $table->index(['vendor_id', 'is_active']);
            $table->index('is_featured');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collections');
    }
};
