<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The builder catalogue: the subset of products offered to trade accounts,
     * each with the price the admin decides. A product with no row here does
     * not appear in the /builder portal at all.
     */
    public function up(): void
    {
        Schema::create('builder_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            // The price builders pay. Authoritative — never derived from
            // products.price at read time, so retail price changes never
            // silently move trade pricing.
            $table->decimal('price', 12, 2);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort')->default(0);
            $table->string('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // One builder price per product.
            $table->unique('product_id');
            $table->index(['is_active', 'sort']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('builder_products');
    }
};
