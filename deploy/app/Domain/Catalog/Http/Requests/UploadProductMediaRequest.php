<?php

namespace App\Domain\Catalog\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadProductMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        $product = $this->route('product');
        return $this->user()->can('update', $product);
    }

    public function rules(): array
    {
        return [
            'files' => ['required', 'array', 'max:20'],
            'files.*' => [
                'required',
                'file',
                'max:102400', // 100MB max per file
                'mimes:jpeg,jpg,png,gif,webp,mp4,webm,mov',
            ],
            'type' => ['nullable', Rule::in(['image', 'video'])],
        ];
    }

    public function messages(): array
    {
        return [
            'files.required' => 'Please select at least one file to upload.',
            'files.max' => 'You can upload a maximum of 20 files at once.',
            'files.*.max' => 'Each file must be less than 100MB.',
            'files.*.mimes' => 'Files must be images (JPEG, PNG, GIF, WebP) or videos (MP4, WebM, MOV).',
        ];
    }
}
