<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-account trade catalogues.
 *
 * builder_products is a single catalogue every trade account sees at the same
 * price. This table overrides that for one account: which products it may buy,
 * and what it pays.
 *
 * The rule is deliberately all-or-nothing per account, because a per-product
 * mixture of "mine" and "everyone's" is impossible to reason about from the
 * admin screen:
 *
 *   an account with NO rows here  -> sees the shared catalogue, unchanged
 *   an account with ANY rows here -> sees ONLY these products
 *
 * That keeps every existing account working exactly as before until someone
 * deliberately gives one its own list.
 *
 * price is nullable on purpose: a row with no price means "this account may
 * buy this product, at the shared catalogue price", so a bespoke product list
 * does not force re-entering prices that have not changed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('builder_account_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            // Null = inherit the shared builder price for this product.
            $table->decimal('price', 12, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort')->default(0);
            $table->string('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // One price per product per account.
            $table->unique(['user_id', 'product_id']);
            // The portal asks "what may this account see?" on every listing.
            $table->index(['user_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('builder_account_products');
    }
};
