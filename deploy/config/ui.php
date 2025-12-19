<?php

return [
    'topBar' => [
        'enabled' => env('UI_TOPBAR_ENABLED', true),
        'backgroundColor' => env('UI_TOPBAR_BG', '#205258'),
        'textColor' => env('UI_TOPBAR_TEXT_COLOR', '#ffffff'),
        'message' => env('UI_TOPBAR_MESSAGE', 'Free shipping over ₹999 · 7-day returns'),
        'link' => [
            'label' => env('UI_TOPBAR_LINK_LABEL', 'Support'),
            'route' => env('UI_TOPBAR_LINK_ROUTE', 'pages.contact'),
        ],
    ],
];
