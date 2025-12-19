<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collection_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->enum('source', ['manual', 'auto'])->default('manual');
            $table->integer('sort_order')->default(0);
            $table->timestamp('computed_at')->nullable()->comment('When auto-assigned');
            $table->timestamps();

            $table->unique(['collection_id', 'product_id', 'source']);
            $table->index(['collection_id', 'sort_order']);
            $table->index(['product_id', 'source']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_products');
    }
};
