<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function about(): Response
    {
        return Inertia::render('Storefront/About');
    }

    public function contact(): Response
    {
        return Inertia::render('Storefront/Contact');
    }
}
