<?php

namespace App\Domain\Dashboard\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDashboardLayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return (bool) ($user?->is_seller);
    }

    public function rules(): array
    {
        return [
            'layout' => ['required', 'array'],
            'layout.*.widget_key' => ['required', 'string', 'max:190'],
            'layout.*.enabled' => ['required', 'boolean'],
            'layout.*.sort' => ['required', 'integer', 'min:0', 'max:10000'],
            'layout.*.width' => ['required', 'string', Rule::in(['full', 'half', 'third'])],
            'layout.*.range' => ['nullable', 'string', Rule::in(['today', '7d', '30d'])],
            'layout.*.cache_ttl_seconds' => ['nullable', 'integer', 'min:30', 'max:86400'],
        ];
    }
}
