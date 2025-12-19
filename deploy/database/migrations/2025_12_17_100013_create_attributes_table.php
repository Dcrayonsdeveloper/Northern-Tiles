<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attributes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->enum('type', ['select', 'color', 'size', 'text', 'number'])->default('select');
            $table->json('values_json')->nullable();
            $table->boolean('is_filterable')->default(false);
            $table->boolean('is_visible')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('type');
            $table->index('is_filterable');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attributes');
    }
};
