<?php

namespace App\Domain\CMS\Http\Requests;

use App\Domain\CMS\Models\Page;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Page::class);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:191'],
            'slug' => ['required', 'string', 'max:191', 'unique:pages,slug'],
            'meta_title' => ['nullable', 'string', 'max:191'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'body_json' => ['nullable', 'array'],
            'template' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
            'author_id' => ['nullable', 'exists:authors,id'],
            'reviewed_by' => ['nullable', 'exists:users,id'],
            'published_at' => ['nullable', 'date'],
            'noindex' => ['nullable', 'boolean'],
            'canonical_url' => ['nullable', 'url', 'max:255'],
            'featured_image' => ['nullable', 'string', 'max:500'],
        ];
    }
}
