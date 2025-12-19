<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Favicon -->
        <link rel="icon" type="image/png" href="/public/favicon.png">
        <link rel="icon" type="image/x-icon" href="/public/favicon.ico">
        <link rel="apple-touch-icon" href="/public/favicon.png">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @php
            // Override asset URLs for Hostinger environment where public_html is the root
            ob_start();
        @endphp
        @vite(['resources/js/app.jsx'])
        @php
            $html = ob_get_clean();
            echo str_replace([
                'href="/build/',
                'src="/build/',
            ], [
                'href="/public/build/',
                'src="/public/build/',
            ], $html);
        @endphp
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
