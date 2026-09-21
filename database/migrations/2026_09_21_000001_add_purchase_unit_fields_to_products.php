<?php

use App\Domain\Catalog\Services\ProductUnitResolver;
use App\Models\Product;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Admin control over the buy box.
 *
 * "/ sqm", the word "Area", the "M²" in the stepper, the 10% wastage toggle
 * and the "2 Boxes = 1.50 m²" line were all hardcoded, so a 20kg bag of grout
 * offered an area calculator and a wastage allowance. These three columns let
 * each product say what it is actually sold in.
 *
 * Existing rows are backfilled with what they already display, so the site
 * looks identical the moment this runs — except that products which are not
 * sold by area stop offering a wastage allowance, which was always wrong for
 * them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Shown after the price ("$75.00 / sqm") and inside the quantity
            // stepper. Blank means the product shows no unit at all.
            $table->string('unit_label', 30)->nullable()->after('sqm_per_box');
            // The word before the stepper — "Area", "Qty", or blank for none.
            $table->string('quantity_label', 30)->nullable()->after('unit_label');
            // The 10% wastage toggle, the "we round up to the full box" note
            // and the box subtotal line, together.
            $table->boolean('show_wastage')->default(true)->after('quantity_label');
        });

        $resolver = app(ProductUnitResolver::class);

        Product::query()
            ->with('category:id,name,slug')
            ->chunkById(300, function ($chunk) use ($resolver) {
                foreach ($chunk as $product) {
                    $perArea = $resolver->isSoldPerSquareMetre($product);

                    $product->forceFill([
                        // Exactly what the resolver already prints today.
                        'unit_label' => $resolver->unitLabel($product),
                        // Every product currently shows "Area"; keep it where
                        // an area is what you buy, drop it where it is not.
                        'quantity_label' => $perArea ? 'Area' : 'Qty',
                        'show_wastage' => $perArea,
                    ])->saveQuietly();
                }
            });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['unit_label', 'quantity_label', 'show_wastage']);
        });
    }
};
