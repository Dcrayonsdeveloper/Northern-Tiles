<?php

namespace App\Domain\Catalog\Http\Requests;

use App\Domain\Catalog\Models\BulkImportJob;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Allow admins and sellers to import
        $user = $this->user();
        return $user->is_admin || $user->is_seller;
    }

    public function rules(): array
    {
        $mimeRules = [
            BulkImportJob::TYPE_PRODUCTS_CSV => 'csv,txt',
            BulkImportJob::TYPE_PRICE_UPDATE_CSV => 'csv,txt',
            BulkImportJob::TYPE_MEDIA_ZIP => 'zip',
        ];

        $type = $this->input('type', BulkImportJob::TYPE_PRODUCTS_CSV);
        $mimes = $mimeRules[$type] ?? 'csv,txt';

        return [
            'file' => [
                'required',
                'file',
                'max:51200', // 50MB max
                'mimes:' . $mimes,
            ],
            'type' => [
                'required',
                Rule::in([
                    BulkImportJob::TYPE_PRODUCTS_CSV,
                    BulkImportJob::TYPE_MEDIA_ZIP,
                    BulkImportJob::TYPE_PRICE_UPDATE_CSV,
                ]),
            ],
            'vendor_id' => ['nullable', 'exists:users,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $user = $this->user();

        // Sellers can only import for themselves
        if ($user->is_seller && !$user->is_admin) {
            $this->merge(['vendor_id' => $user->id]);
        }
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Please select a file to import.',
            'file.max' => 'File must be less than 50MB.',
            'file.mimes' => 'Invalid file type. Please upload a CSV file for products/prices or a ZIP file for media.',
            'type.required' => 'Please specify the import type.',
            'type.in' => 'Invalid import type.',
        ];
    }
}
