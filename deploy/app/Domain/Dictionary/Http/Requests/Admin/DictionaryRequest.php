<?php

namespace App\Domain\Dictionary\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DictionaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $entry = $this->route('dictionaryEntry');

        return [
            'locale' => ['required', 'string', 'max:10'],
            'dkey' => [
                'required',
                'string',
                'max:190',
                Rule::unique('dictionaries', 'dkey')
                    ->where(fn ($q) => $q->where('locale', $this->input('locale')))
                    ->ignore($entry?->id),
            ],
            'value_text' => ['nullable', 'string'],
            'group' => ['nullable', 'string', 'max:50'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
