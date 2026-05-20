<?php

namespace App\Domain\Cart\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddToCartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'exists:products,id'],
            'variant_id' => ['nullable', Rule::exists('product_variants', 'id')->where('product_id', $this->input('product_id'))],
            'quantity' => ['nullable', 'numeric', 'min:0.01', 'max:100'],
            'options' => ['nullable', 'array'],
            'is_sample' => ['nullable', 'boolean'],
        ];
    }
}
