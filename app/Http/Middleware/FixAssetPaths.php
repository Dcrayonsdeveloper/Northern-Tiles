<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class FixAssetPaths
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only rewrites paths for the legacy Hostinger layout, where the
        // document root is the application root and assets therefore live
        // under /public/*. When the document root correctly points at
        // public/, this must stay off or every asset URL gains a bogus
        // /public prefix and 404s.
        //
        // Must match VITE_LEGACY_PUBLIC_PREFIX used at build time.
        if (! config('deployment.legacy_public_prefix')) {
            return $response;
        }

        // Only modify HTML responses
        if ($response->headers->get('content-type') && strpos($response->headers->get('content-type'), 'text/html') !== false) {
            $content = $response->getContent();

            // Replace /build/, /images/, and /favicon asset paths with /public/... for Hostinger environment
            // Handle both relative paths and full URLs
            $content = str_replace(
                [
                    'href="/build/',
                    'src="/build/',
                    'href="https://ntiled.com.au/build/',
                    'src="https://ntiled.com.au/build/',
                    'src="/images/',
                    'href="/images/',
                    'href="/favicon.',
                ],
                [
                    'href="/public/build/',
                    'src="/public/build/',
                    'href="https://ntiled.com.au/public/build/',
                    'src="https://ntiled.com.au/public/build/',
                    'src="/public/images/',
                    'href="/public/images/',
                    'href="/public/favicon.',
                ],
                $content
            );

            $response->setContent($content);
        }

        return $response;
    }
}
