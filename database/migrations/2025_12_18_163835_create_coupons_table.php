<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Coupons table (like Shopify discount codes)
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y'])->default('percentage');
            $table->decimal('value', 10, 2)->default(0); // Percentage or fixed amount
            $table->decimal('minimum_purchase', 10, 2)->nullable(); // Minimum order amount
            $table->decimal('maximum_discount', 10, 2)->nullable(); // Cap for percentage discounts
            $table->integer('usage_limit')->nullable(); // Total uses allowed
            $table->integer('usage_limit_per_customer')->nullable(); // Uses per customer
            $table->integer('times_used')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('first_order_only')->default(false);
            $table->json('eligible_products')->nullable(); // Product IDs or null for all
            $table->json('eligible_categories')->nullable(); // Category IDs or null for all
            $table->json('excluded_products')->nullable(); // Excluded product IDs
            $table->json('eligible_customers')->nullable(); // Customer IDs or null for all
            $table->boolean('combinable')->default(false); // Can combine with other coupons
            $table->timestamps();

            $table->index(['code', 'is_active']);
            $table->index(['starts_at', 'expires_at']);
        });

        // Coupon usage tracking
        Schema::create('coupon_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_email')->nullable();
            $table->decimal('discount_amount', 10, 2);
            $table->timestamps();

            $table->index(['coupon_id', 'user_id']);
            $table->index(['coupon_id', 'customer_email']);
        });

        // Add coupon fields to carts table
        Schema::table('carts', function (Blueprint $table) {
            $table->foreignId('coupon_id')->nullable()->after('currency')->constrained()->nullOnDelete();
            $table->decimal('discount_amount', 10, 2)->default(0)->after('coupon_id');
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropForeign(['coupon_id']);
            $table->dropColumn(['coupon_id', 'discount_amount']);
        });

        Schema::dropIfExists('coupon_usages');
        Schema::dropIfExists('coupons');
    }
};
