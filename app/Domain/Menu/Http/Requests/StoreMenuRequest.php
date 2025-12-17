<?php

namespace App\Domain\Menu\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->is_admin;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['required', 'string', 'max:100', 'unique:menus,slug'],
            'location' => ['required', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
