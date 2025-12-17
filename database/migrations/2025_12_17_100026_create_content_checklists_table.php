<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_checklists', function (Blueprint $table) {
            $table->id();
            $table->string('content_type', 50);
            $table->unsignedBigInteger('content_id');
            $table->json('checklist_json');
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('max_score')->default(100);
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamps();

            $table->unique(['content_type', 'content_id']);
            $table->index('score');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_checklists');
    }
};
