<?php

namespace Database\Seeders;

use App\Domain\Marketing\Models\Coupon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class CouponSeeder extends Seeder
{
    public function run(): void
    {
        // Skip if coupons table doesn't exist
        if (!Schema::hasTable('coupons')) {
            return;
        }

        $coupons = [
            [
                'code' => 'WELCOME10',
                'title' => 'Welcome Discount',
                'description' => 'Get 10% off on your first order',
                'type' => 'percentage',
                'value' => 10,
                'minimum_purchase' => 500,
                'maximum_discount' => 200,
                'is_active' => true,
                'first_order_only' => true,
            ],
            [
                'code' => 'FLAT100',
                'title' => 'Flat Rs.100 Off',
                'description' => 'Get flat Rs.100 off on orders above Rs.999',
                'type' => 'fixed_amount',
                'value' => 100,
                'minimum_purchase' => 999,
                'is_active' => true,
            ],
            [
                'code' => 'FREESHIP',
                'title' => 'Free Shipping',
                'description' => 'Free shipping on orders above Rs.499',
                'type' => 'free_shipping',
                'value' => 0,
                'minimum_purchase' => 499,
                'is_active' => true,
            ],
            [
                'code' => 'SAVE20',
                'title' => '20% Discount',
                'description' => 'Get 20% off on orders above Rs.1500',
                'type' => 'percentage',
                'value' => 20,
                'minimum_purchase' => 1500,
                'maximum_discount' => 500,
                'is_active' => true,
            ],
        ];

        foreach ($coupons as $couponData) {
            Coupon::updateOrCreate(
                ['code' => $couponData['code']],
                $couponData
            );
        }
    }
}
