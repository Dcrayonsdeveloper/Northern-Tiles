<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('not_found_logs', function (Blueprint $table) {
            $table->id();
            $table->string('path', 500);
            $table->string('referer', 500)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->unsignedInteger('hit_count')->default(1);
            $table->timestamp('first_hit_at')->nullable();
            $table->timestamp('last_hit_at')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->foreignId('redirect_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index('path');
            $table->index('hit_count');
            $table->index('last_hit_at');
            $table->index('is_resolved');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('not_found_logs');
    }
};
