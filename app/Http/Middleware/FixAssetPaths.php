<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class FixAssetPaths
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only apply in production (Hostinger) - skip for local development
        if (app()->environment('local')) {
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
