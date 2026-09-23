<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visualizer_room_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('visualizer_room_id')->constrained()->cascadeOnDelete();
            $table->string('image_path');
            $table->json('floor_bounds')->nullable()->comment('JSON: {x, y, width, height} as percentages');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['visualizer_room_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visualizer_room_images');
    }
};
