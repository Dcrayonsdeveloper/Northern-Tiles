<?php

namespace App\Domain\CMS\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('post'));
    }

    public function rules(): array
    {
        $postId = $this->route('post')->id ?? $this->route('post');

        return [
            'title' => ['required', 'string', 'max:191'],
            'slug' => ['required', 'string', 'max:191', Rule::unique('posts', 'slug')->ignore($postId)],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'meta_title' => ['nullable', 'string', 'max:191'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'body_json' => ['nullable', 'array'],
            'featured_image' => ['nullable', 'string', 'max:500'],
            'category_id' => ['nullable', 'exists:post_categories,id'],
            'author_id' => ['nullable', 'exists:authors,id'],
            'reviewed_by' => ['nullable', 'exists:users,id'],
            'reviewed_at' => ['nullable', 'date'],
            'sources_json' => ['nullable', 'array'],
            'sources_json.*.title' => ['required_with:sources_json', 'string', 'max:191'],
            'sources_json.*.url' => ['nullable', 'url', 'max:500'],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
            'published_at' => ['nullable', 'date'],
            'noindex' => ['nullable', 'boolean'],
            'canonical_url' => ['nullable', 'url', 'max:255'],
            'is_featured' => ['nullable', 'boolean'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
        ];
    }
}
