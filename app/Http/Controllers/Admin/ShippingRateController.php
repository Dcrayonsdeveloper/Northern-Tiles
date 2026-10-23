<?php

namespace App\Http\Controllers\Admin;

use App\Domain\Cart\Services\ShippingRates;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin > Shipping Rates: the delivery charge per state or territory for
 * orders with tiles, and the flat fee for an order of nothing but samples.
 */
class ShippingRateController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Admin/ShippingRates/Edit', [
            'sampleRate' => ShippingRates::sampleRate(),
            'stateRates' => ShippingRates::stateRates(),
            'states' => ShippingRates::STATES,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'sample_rate' => ['required', 'numeric', 'min:0', 'max:10000'],
            'state_rates' => ['nullable', 'array'],
            // Blank is allowed and means "quote it", not free.
            'state_rates.*' => ['nullable', 'numeric', 'min:0', 'max:100000'],
        ]);

        ShippingRates::save((float) $validated['sample_rate'], $validated['state_rates'] ?? []);

        return redirect()->route('admin.shipping-rates.edit')->with('success', 'Shipping rates saved.');
    }
}
