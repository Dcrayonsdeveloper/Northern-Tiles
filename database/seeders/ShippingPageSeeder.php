<?php

namespace Database\Seeders;

/**
 * Reseeds only the Shipping & Delivery page (/shipping) from StaticPagesSeeder.
 *
 * StaticPagesSeeder rewrites all five footer pages, which on production would
 * also overwrite any edits made to the others in the CMS. Run this instead
 * when only the shipping content has changed:
 *
 *   php artisan db:seed --class=ShippingPageSeeder --force
 */
class ShippingPageSeeder extends StaticPagesSeeder
{
    protected array $only = ['shipping'];
}
