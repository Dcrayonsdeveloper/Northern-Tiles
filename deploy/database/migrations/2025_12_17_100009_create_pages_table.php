<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('title', 191);
            $table->string('slug', 191)->unique();
            $table->string('meta_title', 191)->nullable();
            $table->text('meta_description')->nullable();
            $table->json('body_json')->nullable();
            $table->string('template', 50)->default('default');
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->foreignId('author_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->boolean('noindex')->default(false);
            $table->string('canonical_url')->nullable();
            $table->string('featured_image')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('published_at');
            $table->index('author_id');
            $table->index('template');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
