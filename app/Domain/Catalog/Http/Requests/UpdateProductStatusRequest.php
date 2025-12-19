<?php

namespace App\Domain\Catalog\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $product = $this->route('product');
        return $this->user()->can('update', $product);
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    Product::STATUS_DRAFT,
                    Product::STATUS_PUBLISHED,
                    Product::STATUS_SCHEDULED,
                    Product::STATUS_ARCHIVED,
                ]),
            ],
            'published_at' => [
                'nullable',
                'date',
                'required_if:status,' . Product::STATUS_SCHEDULED,
                'after:now',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Please select a status.',
            'status.in' => 'Invalid status selected.',
            'published_at.required_if' => 'Please select a publish date for scheduled products.',
            'published_at.after' => 'Scheduled publish date must be in the future.',
        ];
    }
}
