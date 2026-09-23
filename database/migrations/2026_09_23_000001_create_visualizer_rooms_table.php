<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visualizer_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('image_path');
            $table->json('floor_bounds')->nullable()->comment('JSON: {x, y, width, height} as percentages');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });

        // Pivot table for visualizer rooms and featured products
        Schema::create('visualizer_room_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('visualizer_room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['visualizer_room_id', 'product_id']);
            $table->index(['visualizer_room_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visualizer_room_products');
        Schema::dropIfExists('visualizer_rooms');
    }
};
