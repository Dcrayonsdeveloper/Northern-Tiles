<?php

namespace App\Domain\SEO\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSeoMetaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->is_admin || $this->user()->hasPermission('seo.manage');
    }

    public function rules(): array
    {
        return [
            'model_type' => ['required', 'string', 'max:100'],
            'model_id' => ['required', 'integer'],
            'meta_title' => ['nullable', 'string', 'max:191'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'string', 'max:255'],
            'og_title' => ['nullable', 'string', 'max:191'],
            'og_description' => ['nullable', 'string', 'max:500'],
            'og_image' => ['nullable', 'string', 'max:500'],
            'og_type' => ['nullable', 'string', 'max:50'],
            'twitter_title' => ['nullable', 'string', 'max:191'],
            'twitter_description' => ['nullable', 'string', 'max:500'],
            'twitter_image' => ['nullable', 'string', 'max:500'],
            'twitter_card' => ['nullable', Rule::in(['summary', 'summary_large_image', 'app', 'player'])],
            'canonical_url' => ['nullable', 'url', 'max:500'],
            'noindex' => ['nullable', 'boolean'],
            'nofollow' => ['nullable', 'boolean'],
            'schema_json' => ['nullable', 'array'],
            'custom_meta_json' => ['nullable', 'array'],
        ];
    }
}
