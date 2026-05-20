<?php

namespace App\Domain\CMS\Http\Requests;

use App\Domain\CMS\Models\Post;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Post::class);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:191'],
            'slug' => ['required', 'string', 'max:191', 'unique:posts,slug'],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'meta_title' => ['nullable', 'string', 'max:191'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'body_json' => ['nullable'],
            'featured_image' => ['nullable', 'file', 'image', 'max:5120'],
            'category_id' => ['nullable', 'exists:post_categories,id'],
            'author_id' => ['nullable', 'exists:authors,id'],
            'reviewed_by' => ['nullable', 'exists:users,id'],
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
