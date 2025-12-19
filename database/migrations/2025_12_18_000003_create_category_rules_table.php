<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('rules_json')->comment('Auto-assignment rules');
            $table->enum('match_type', ['all', 'any'])->default('all');
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0)->comment('Higher = processed first');
            $table->timestamp('last_run_at')->nullable();
            $table->integer('matched_count')->default(0);
            $table->timestamps();

            $table->index(['category_id', 'is_active']);
            $table->index(['vendor_id', 'is_active']);
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_rules');
    }
};
