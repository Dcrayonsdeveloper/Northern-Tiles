<?php

namespace App\Domain\Dashboard\Http\Controllers\Admin;

use App\Domain\Dashboard\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController
{
    public function __invoke(Request $request, DashboardService $dash): Response
    {
        $range = $request->string('range')->toString() ?: '30d';

        return Inertia::render('Admin/Dashboard', [
            'widgets' => $dash->widgetsForUser($request->user(), $range),
            'range' => $range,
        ]);
    }
}
