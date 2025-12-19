<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->string('email')->nullable()->after('session_id');
            $table->foreignId('customer_id')->nullable()->after('email')->constrained('users')->nullOnDelete();
            $table->foreignId('vendor_id')->nullable()->after('customer_id')->constrained('users')->nullOnDelete();
            $table->timestamp('abandoned_at')->nullable()->after('expires_at');
            $table->foreignId('recovered_order_id')->nullable()->after('abandoned_at')->constrained('orders')->nullOnDelete();
            $table->boolean('marketing_opt_in')->default(false)->after('recovered_order_id');
            $table->string('unsubscribe_token')->nullable()->unique()->after('marketing_opt_in');
            $table->timestamp('last_activity_at')->nullable()->after('unsubscribe_token');

            $table->index('email');
            $table->index('abandoned_at');
            $table->index(['vendor_id', 'abandoned_at']);
            $table->index('marketing_opt_in');
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropIndex(['email']);
            $table->dropIndex(['abandoned_at']);
            $table->dropIndex(['vendor_id', 'abandoned_at']);
            $table->dropIndex(['marketing_opt_in']);

            $table->dropForeign(['customer_id']);
            $table->dropForeign(['vendor_id']);
            $table->dropForeign(['recovered_order_id']);

            $table->dropColumn([
                'email',
                'customer_id',
                'vendor_id',
                'abandoned_at',
                'recovered_order_id',
                'marketing_opt_in',
                'unsubscribe_token',
                'last_activity_at',
            ]);
        });
    }
};
