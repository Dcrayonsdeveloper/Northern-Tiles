<?php

namespace App\Domain\Catalog\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('product'));
    }

    public function rules(): array
    {
        $productId = $this->route('product')->id ?? $this->route('product');

        return [
            // Basic info
            'name' => ['sometimes', 'required', 'string', 'max:191'],
            'slug' => ['nullable', 'string', 'max:191', Rule::unique('products', 'slug')->ignore($productId)],
            'sku' => ['nullable', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($productId)],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'description_json' => ['nullable', 'array'],
            'brand' => ['nullable', 'string', 'max:100'],
            'product_type' => ['nullable', 'string', 'max:100'],

            // Categories (many-to-many)
            'category_id' => ['nullable', 'exists:categories,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['exists:categories,id'],

            // Vendor/seller
            'seller_id' => ['nullable', 'exists:users,id'],
            'attribute_set_id' => ['nullable', 'exists:attribute_sets,id'],

            // Pricing
            'price' => ['nullable', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'default_currency' => ['nullable', 'string', 'size:3'],

            // Inventory
            'inventory_quantity' => ['nullable', 'integer', 'min:0'],
            'inventory_policy' => ['nullable', Rule::in(['deny', 'continue'])],

            // Shipping & dimensions
            'requires_shipping' => ['nullable', 'boolean'],
            'is_digital' => ['nullable', 'boolean'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'length_mm' => ['nullable', 'integer', 'min:0'],
            'width_mm' => ['nullable', 'integer', 'min:0'],
            'height_mm' => ['nullable', 'integer', 'min:0'],
            'sqm_per_box' => ['nullable', 'numeric', 'min:0'],

            // Status & publishing
            'status' => ['nullable', Rule::in([
                Product::STATUS_DRAFT,
                Product::STATUS_PUBLISHED,
                Product::STATUS_SCHEDULED,
                Product::STATUS_ARCHIVED,
            ])],
            'published_at' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],

            // SEO
            'meta_title' => ['nullable', 'string', 'max:191'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'canonical_url' => ['nullable', 'url', 'max:255'],
            'og_image_path' => ['nullable', 'string', 'max:255'],
            'noindex' => ['nullable', 'boolean'],

            // Images
            'image_url' => ['nullable', 'string', 'max:500'],
            'lifestyle_image_url' => ['nullable', 'string', 'max:500'],

            // Structured specifications
            'specifications' => ['nullable', 'array'],
            'specifications.*' => ['nullable', 'string', 'max:500'],

            // Featured
            'is_featured' => ['nullable', 'boolean'],

            // Tags
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:100'],

            // Options (for variant generation)
            'options' => ['nullable', 'array'],
            'options.*.id' => ['nullable', 'exists:product_options,id'],
            'options.*.name' => ['required_with:options', 'string', 'max:100'],
            'options.*.values' => ['nullable', 'array'],
            'options.*.values.*.id' => ['nullable', 'exists:product_option_values,id'],
            'options.*.values.*.value' => ['nullable', 'string', 'max:100'],

            // Variants
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['nullable', 'exists:product_variants,id'],
            'variants.*.sku' => ['nullable', 'string', 'max:100'],
            'variants.*.barcode' => ['nullable', 'string', 'max:100'],
            'variants.*.price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.cost' => ['nullable', 'numeric', 'min:0'],
            'variants.*.inventory_quantity' => ['nullable', 'integer', 'min:0'],
            'variants.*.inventory_policy' => ['nullable', Rule::in(['deny', 'continue'])],
            'variants.*.track_inventory' => ['nullable', 'boolean'],
            'variants.*.requires_shipping' => ['nullable', 'boolean'],
            'variants.*.weight_grams' => ['nullable', 'integer', 'min:0'],
            'variants.*.length_mm' => ['nullable', 'integer', 'min:0'],
            'variants.*.width_mm' => ['nullable', 'integer', 'min:0'],
            'variants.*.height_mm' => ['nullable', 'integer', 'min:0'],
            'variants.*.option_value_ids' => ['nullable', 'array'],
            'variants.*.is_active' => ['nullable', 'boolean'],
            'variants.*.is_default' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Product name is required.',
            'price.min' => 'Price must be a positive number.',
            'category_ids.*.exists' => 'One or more selected categories do not exist.',
        ];
    }
}
