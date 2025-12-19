<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Product options (e.g., Color, Size, Material)
        Schema::create('product_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->unsignedTinyInteger('position')->default(0);
            $table->timestamps();

            $table->index(['product_id', 'position']);
        });

        // Option values (e.g., Red, Blue, Small, Large)
        Schema::create('product_option_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_option_id')->constrained()->cascadeOnDelete();
            $table->string('value', 100);
            $table->unsignedTinyInteger('position')->default(0);
            $table->json('meta_json')->nullable();
            $table->timestamps();

            $table->index(['product_option_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_option_values');
        Schema::dropIfExists('product_options');
    }
};
