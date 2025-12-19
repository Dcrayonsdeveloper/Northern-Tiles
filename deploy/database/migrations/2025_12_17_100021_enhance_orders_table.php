<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'order_number')) {
                $table->string('order_number', 50)->unique()->nullable()->after('id');
            }
            if (!Schema::hasColumn('orders', 'status')) {
                $table->enum('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])->default('pending')->after('order_number');
            }
            if (!Schema::hasColumn('orders', 'subtotal')) {
                $table->decimal('subtotal', 10, 2)->default(0)->after('total');
            }
            if (!Schema::hasColumn('orders', 'tax')) {
                $table->decimal('tax', 10, 2)->default(0)->after('subtotal');
            }
            if (!Schema::hasColumn('orders', 'shipping_cost')) {
                $table->decimal('shipping_cost', 10, 2)->default(0)->after('tax');
            }
            if (!Schema::hasColumn('orders', 'discount')) {
                $table->decimal('discount', 10, 2)->default(0)->after('shipping_cost');
            }
            if (!Schema::hasColumn('orders', 'currency')) {
                $table->string('currency', 3)->default('USD')->after('discount');
            }
            if (!Schema::hasColumn('orders', 'shipping_address_json')) {
                $table->json('shipping_address_json')->nullable()->after('currency');
            }
            if (!Schema::hasColumn('orders', 'billing_address_json')) {
                $table->json('billing_address_json')->nullable()->after('shipping_address_json');
            }
            if (!Schema::hasColumn('orders', 'payment_method')) {
                $table->string('payment_method', 50)->nullable()->after('billing_address_json');
            }
            if (!Schema::hasColumn('orders', 'payment_status')) {
                $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])->default('pending')->after('payment_method');
            }
            if (!Schema::hasColumn('orders', 'notes')) {
                $table->text('notes')->nullable()->after('payment_status');
            }
            if (!Schema::hasColumn('orders', 'shipped_at')) {
                $table->timestamp('shipped_at')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('orders', 'delivered_at')) {
                $table->timestamp('delivered_at')->nullable()->after('shipped_at');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasIndex('orders', 'orders_status_index')) {
                $table->index('status');
            }
            if (!Schema::hasIndex('orders', 'orders_payment_status_index')) {
                $table->index('payment_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $columns = ['order_number', 'status', 'subtotal', 'tax', 'shipping_cost', 'discount', 'currency', 'shipping_address_json', 'billing_address_json', 'payment_method', 'payment_status', 'notes', 'shipped_at', 'delivered_at'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('orders', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
