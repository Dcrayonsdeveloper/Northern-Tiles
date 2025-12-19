<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_id')->constrained('pages')->cascadeOnDelete();
            $table->string('section_key', 100);
            $table->json('data_json')->nullable();
            $table->integer('sort')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['page_id', 'sort']);
            $table->index('section_key');
            $table->index('is_active');

            $table->foreign('section_key')
                ->references('section_key')
                ->on('section_registry')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_sections');
    }
};
