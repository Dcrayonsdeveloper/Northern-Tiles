<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Existing INT rows convert losslessly (e.g. 2 → 2.00). Decimal lets us
        // store fractional m² so 10% wastage isn't lost to a Math.ceil round-up
        // before the cart can display it.
        DB::statement('ALTER TABLE cart_items MODIFY quantity DECIMAL(10, 2) NOT NULL DEFAULT 1');
        DB::statement('ALTER TABLE order_items MODIFY quantity DECIMAL(10, 2) NOT NULL');
    }

    public function down(): void
    {
        // Round up before reverting to INT so we never undersell a partial m².
        DB::statement('UPDATE cart_items SET quantity = CEIL(quantity)');
        DB::statement('UPDATE order_items SET quantity = CEIL(quantity)');
        DB::statement('ALTER TABLE cart_items MODIFY quantity INT UNSIGNED NOT NULL DEFAULT 1');
        DB::statement('ALTER TABLE order_items MODIFY quantity INT UNSIGNED NOT NULL');
    }
};
