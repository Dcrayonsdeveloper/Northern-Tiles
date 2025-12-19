<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dictionaries', function (Blueprint $table) {
            $table->id();
            $table->string('locale', 10)->default('en');
            $table->string('dkey', 190);
            $table->longText('value_text')->nullable();
            $table->string('group', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['locale', 'dkey']);
            $table->index('group');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dictionaries');
    }
};
