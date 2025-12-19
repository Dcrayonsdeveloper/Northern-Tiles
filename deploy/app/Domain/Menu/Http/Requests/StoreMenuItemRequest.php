<?php

namespace App\Domain\Menu\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->is_admin;
    }

    public function rules(): array
    {
        return [
            'menu_id' => ['required', 'exists:menus,id'],
            'parent_id' => ['nullable', 'exists:menu_items,id'],
            'label' => ['required', 'string', 'max:191'],
            'url' => ['nullable', 'string', 'max:500'],
            'route_name' => ['nullable', 'string', 'max:100'],
            'route_params' => ['nullable', 'array'],
            'target' => ['nullable', Rule::in(['_self', '_blank', '_parent', '_top'])],
            'icon' => ['nullable', 'string', 'max:100'],
            'css_class' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
