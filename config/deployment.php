<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Legacy public path prefix
    |--------------------------------------------------------------------------
    |
    | Some shared hosts cannot repoint a domain's document root, so the whole
    | Laravel application ends up inside the web root and assets have to be
    | referenced as /public/build/* instead of /build/*.
    |
    | false (recommended) — document root points at <base>/current/public.
    | true  (legacy)      — document root is the application root.
    |
    | This MUST match the VITE_LEGACY_PUBLIC_PREFIX value used when the
    | frontend was built, because that decides the base path baked into the
    | Vite manifest. A mismatch 404s every stylesheet and script.
    |
    */

    'legacy_public_prefix' => filter_var(
        env('LEGACY_PUBLIC_PREFIX', false),
        FILTER_VALIDATE_BOOLEAN
    ),

    /*
    |--------------------------------------------------------------------------
    | Trusted proxies
    |--------------------------------------------------------------------------
    |
    | Hostinger fronts sites with LiteSpeed, and AWS with an ALB/CloudFront.
    | Both terminate TLS upstream, so without trusting them Laravel sees plain
    | HTTP and generates http:// URLs on an https:// site — which browsers
    | then block as mixed content.
    |
    | '*' trusts whatever proxy sits in front of the app. That is correct on
    | managed hosting where the proxy is the only route to the origin. If you
    | expose the origin directly, list the proxy IPs instead.
    |
    */

    'trusted_proxies' => env('TRUSTED_PROXIES', '*'),

];
