<?php

namespace App\Domain\Dashboard\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return (bool) ($user?->is_admin);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:190'],
            'body_html' => ['required', 'string'],
            'audience' => ['required', 'array'],
            'audience.*' => ['required', 'string', Rule::in(['admin', 'seller'])],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
