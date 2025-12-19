<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attribute_sets', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('attribute_attribute_set', function (Blueprint $table) {
            $table->foreignId('attribute_set_id')->constrained()->cascadeOnDelete();
            $table->foreignId('attribute_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->primary(['attribute_set_id', 'attribute_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attribute_attribute_set');
        Schema::dropIfExists('attribute_sets');
    }
};
