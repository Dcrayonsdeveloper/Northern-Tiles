<?php

namespace App\Domain\SEO\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRedirectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->is_admin;
    }

    public function rules(): array
    {
        return [
            'from_path' => ['required', 'string', 'max:500'],
            'to_path' => ['required', 'string', 'max:500'],
            'status_code' => ['nullable', Rule::in([301, 302, 307, 308])],
            'is_active' => ['nullable', 'boolean'],
            'is_regex' => ['nullable', 'boolean'],
        ];
    }
}
