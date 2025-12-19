<?php

namespace App\Domain\CMS\Http\Requests;

use App\Domain\CMS\Models\Page;
use App\Domain\CMS\Services\PageService;
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
            // Core fields
            'title' => ['required', 'string', 'max:191'],
            'slug' => [
                'required',
                'string',
                'max:120',
                'alpha_dash',
                function ($attribute, $value, $fail) {
                    $parentId = $this->input('parent_id');
                    $pageService = app(PageService::class);

                    if ($pageService->slugExistsInScope($value, $parentId)) {
                        $fail('This slug already exists under the selected parent.');
                    }
                },
            ],
            'parent_id' => [
                'nullable',
                'exists:pages,id',
                function ($attribute, $value, $fail) {
                    // Ensure parent is not deleted
                    if ($value && !Page::where('id', $value)->whereNull('deleted_at')->exists()) {
                        $fail('The selected parent page does not exist.');
                    }
                },
            ],

            // Content
            'body_json' => ['nullable', 'array'],
            'template' => ['nullable', 'string', 'max:50'],

            // Status & scheduling
            'status' => ['nullable', Rule::in(Page::STATUSES)],
            'published_at' => ['nullable', 'date', 'required_if:status,scheduled'],

            // SEO fields
            'meta_title' => ['nullable', 'string', 'max:70'],
            'meta_description' => ['nullable', 'string', 'max:170'],
            'canonical_url' => ['nullable', 'url', 'max:500'],
            'noindex' => ['nullable', 'boolean'],
            'robots_follow' => ['nullable', 'boolean'],

            // Images
            'featured_image_file' => [
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:4096',
            ],
            'og_image_file' => [
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:4096',
                'dimensions:min_width=1200,min_height=630',
            ],

            // Author & sorting
            'author_id' => ['nullable', 'exists:authors,id'],
            'sort' => ['nullable', 'integer', 'min:0', 'max:10000'],

            // Page sections
            'sections' => ['nullable', 'array', 'max:30'],
            'sections.*.section_key' => ['required_with:sections', 'string', 'exists:section_registry,section_key'],
            'sections.*.data_json' => ['nullable', 'array'],
            'sections.*.sort' => ['nullable', 'integer', 'min:0'],
            'sections.*.is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.alpha_dash' => 'The slug may only contain letters, numbers, dashes, and underscores.',
            'published_at.required_if' => 'A publish date is required when scheduling a page.',
            'meta_title.max' => 'The meta title should not exceed 70 characters for optimal SEO.',
            'meta_description.max' => 'The meta description should not exceed 170 characters for optimal SEO.',
            'og_image_file.dimensions' => 'The OG image must be at least 1200x630 pixels.',
            'sections.max' => 'A page cannot have more than 30 sections.',
        ];
    }
}
