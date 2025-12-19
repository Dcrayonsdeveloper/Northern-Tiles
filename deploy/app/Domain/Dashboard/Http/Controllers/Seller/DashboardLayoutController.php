<?php

namespace App\Domain\Dashboard\Http\Controllers\Seller;

use App\Domain\Dashboard\Http\Requests\Seller\UpdateDashboardLayoutRequest;
use App\Domain\Dashboard\Services\DashboardService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardLayoutController
{
    public function edit(Request $request, DashboardService $dash): Response
    {
        $user = $request->user();

        return Inertia::render('Seller/DashboardLayout', [
            'availableWidgets' => $dash->availableWidgetsForRole('seller'),
            'layout' => $dash->layoutForUser($user, 'seller'),
        ]);
    }

    public function update(UpdateDashboardLayoutRequest $request, DashboardService $dash): RedirectResponse
    {
        $validated = $request->validated();

        $dash->saveUserLayout($request->user(), $validated['layout']);

        return redirect()->back()->with('success', 'Dashboard layout saved.');
    }
}
