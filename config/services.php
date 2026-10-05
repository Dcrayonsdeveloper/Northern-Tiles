<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'instagram' => [
        'access_token' => env('INSTAGRAM_ACCESS_TOKEN'),
    ],

    'google' => [
        'api_key' => env('GOOGLE_API_KEY'),
    ],

    /*
    | Stripe card payments.
    |
    | StripePaymentService reads every one of these through
    | config('services.stripe.*'), and this block did not exist — so all five
    | resolved to null, isEnabled() returned false, and card payment was hidden
    | at checkout no matter what STRIPE_* held in .env. The keys were set and
    | the integration was simply never reachable.
    |
    | `enabled` is a separate switch from `secret` on purpose: keys can be in
    | place while the payment method is still withheld from customers, which is
    | what you want between configuring Stripe and being ready to take money.
    */
    'stripe' => [
        'enabled' => env('STRIPE_ENABLED', false),
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        // Blank until the endpoint exists in Stripe. The webhook route returns
        // 503 while it is empty rather than trusting an unsigned payload —
        // without that, anyone knowing the URL could mark orders paid.
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        // Must match what PricingService computes; Stripe charges in the
        // order's currency, and orders default to AUD.
        'currency' => env('STRIPE_CURRENCY', 'aud'),
    ],

];
