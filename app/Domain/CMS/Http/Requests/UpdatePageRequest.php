<?php

namespace App\Domain\CMS\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('page'));
    }

    public function rules(): array
    {
        $pageId = $this->route('page')->id ?? $this->route('page');

        return [
            'title' => ['required', 'string', 'max:191'],
            'slug' => ['required', 'string', 'max:191', Rule::unique('pages', 'slug')->ignore($pageId)],
            'meta_title' => ['nullable', 'string', 'max:191'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'body_json' => ['nullable', 'array'],
            'template' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
            'author_id' => ['nullable', 'exists:authors,id'],
            'reviewed_by' => ['nullable', 'exists:users,id'],
            'reviewed_at' => ['nullable', 'date'],
            'published_at' => ['nullable', 'date'],
            'noindex' => ['nullable', 'boolean'],
            'canonical_url' => ['nullable', 'url', 'max:255'],
            'featured_image' => ['nullable', 'string', 'max:500'],
        ];
    }
}
