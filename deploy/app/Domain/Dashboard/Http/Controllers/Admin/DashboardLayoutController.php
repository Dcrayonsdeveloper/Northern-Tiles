<?php

namespace App\Domain\Dashboard\Http\Controllers\Admin;

use App\Domain\Dashboard\Http\Requests\Admin\UpdateDashboardLayoutRequest;
use App\Domain\Dashboard\Services\DashboardService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardLayoutController
{
    public function edit(Request $request, DashboardService $dash): Response
    {
        $role = $request->string('role')->toString() ?: 'admin';

        if (!in_array($role, ['admin', 'seller'], true)) {
            $role = 'admin';
        }

        return Inertia::render('Admin/DashboardLayout', [
            'role' => $role,
            'availableWidgets' => $dash->availableWidgetsForRole($role),
            'layout' => $dash->layoutForRole($role),
        ]);
    }

    public function update(UpdateDashboardLayoutRequest $request, DashboardService $dash): RedirectResponse
    {
        $validated = $request->validated();

        $dash->saveRoleLayout($validated['role'], $validated['layout']);

        return redirect()->back()->with('success', 'Dashboard layout saved.');
    }
}
