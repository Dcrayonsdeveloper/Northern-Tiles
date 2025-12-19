<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class FixAssetPaths
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only modify HTML responses
        if ($response->headers->get('content-type') && strpos($response->headers->get('content-type'), 'text/html') !== false) {
            $content = $response->getContent();

            // Replace /build/ asset paths with /public/build/ for Hostinger environment
            $content = str_replace(
                ['href="/build/', 'src="/build/'],
                ['href="/public/build/', 'src="/public/build/'],
                $content
            );

            $response->setContent($content);
        }

        return $response;
    }
}
