<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('section_registry', function (Blueprint $table) {
            $table->id();
            $table->string('section_key', 100)->unique();
            $table->string('title_key', 191);
            $table->string('description_key', 191)->nullable();
            $table->string('icon', 50)->nullable();
            $table->string('category', 50)->default('content');
            $table->json('schema_json')->nullable();
            $table->json('default_data')->nullable();
            $table->json('role_scope')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort')->default(0);
            $table->timestamps();

            $table->index('category');
            $table->index('is_active');
            $table->index('sort');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('section_registry');
    }
};
