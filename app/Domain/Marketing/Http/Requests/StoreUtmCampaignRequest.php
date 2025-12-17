<?php

namespace App\Domain\Marketing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUtmCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->is_admin || $this->user()->hasPermission('marketing.manage');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:191'],
            'utm_source' => ['required', 'string', 'max:100'],
            'utm_medium' => ['required', 'string', 'max:100'],
            'utm_campaign' => ['required', 'string', 'max:100'],
            'utm_term' => ['nullable', 'string', 'max:100'],
            'utm_content' => ['nullable', 'string', 'max:100'],
            'landing_url' => ['required', 'url', 'max:2000'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['created_by' => $this->user()->id]);
    }
}
