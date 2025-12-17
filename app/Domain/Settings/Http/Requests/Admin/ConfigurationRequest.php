<?php

namespace App\Domain\Settings\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'site_title' => ['required', 'string', 'max:255'],
            'site_description' => ['nullable', 'string', 'max:500'],

            'twitter_site' => ['nullable', 'string', 'max:64'],
            'twitter_creator' => ['nullable', 'string', 'max:64'],

            'og_image' => ['nullable', 'file', 'image', 'max:4096'],
            'remove_og_image' => ['nullable', 'boolean'],

            'menu_header_top' => ['nullable', 'array'],
            'menu_header_top.*.label' => ['required_with:menu_header_top', 'string', 'max:120'],
            'menu_header_top.*.url' => ['required_with:menu_header_top', 'string', 'max:500'],
            'menu_header_top.*.target' => ['required_with:menu_header_top', 'string', Rule::in(['_self', '_blank'])],
            'menu_header_top.*.is_active' => ['nullable', 'boolean'],
            'menu_header_top.*.sort' => ['nullable', 'integer', 'min:0', 'max:10000'],

            'menu_header_main' => ['nullable', 'array'],
            'menu_header_main.*.label' => ['required_with:menu_header_main', 'string', 'max:120'],
            'menu_header_main.*.url' => ['required_with:menu_header_main', 'string', 'max:500'],
            'menu_header_main.*.target' => ['required_with:menu_header_main', 'string', Rule::in(['_self', '_blank'])],
            'menu_header_main.*.is_active' => ['nullable', 'boolean'],
            'menu_header_main.*.sort' => ['nullable', 'integer', 'min:0', 'max:10000'],

            'menu_footer' => ['nullable', 'array'],
            'menu_footer.*.label' => ['required_with:menu_footer', 'string', 'max:120'],
            'menu_footer.*.url' => ['required_with:menu_footer', 'string', 'max:500'],
            'menu_footer.*.target' => ['required_with:menu_footer', 'string', Rule::in(['_self', '_blank'])],
            'menu_footer.*.is_active' => ['nullable', 'boolean'],
            'menu_footer.*.sort' => ['nullable', 'integer', 'min:0', 'max:10000'],
        ];
    }
}
