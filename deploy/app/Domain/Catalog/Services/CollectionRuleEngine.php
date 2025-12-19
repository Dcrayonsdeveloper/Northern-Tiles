<?php

namespace App\Domain\Catalog\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class CollectionRuleEngine
{
    /**
     * Whitelisted fields that can be used in rules.
     */
    protected array $allowedFields = [
        'tag',
        'title',
        'name',
        'vendor',
        'seller_id',
        'product_type',
        'price',
        'compare_at_price',
        'created_at',
        'updated_at',
        'published_at',
        'inventory_quantity',
        'category_id',
        'status',
        'is_active',
        'brand',
        'sku',
    ];

    /**
     * Whitelisted operators.
     */
    protected array $allowedOperators = [
        'eq',           // equals
        'neq',          // not equals
        'contains',     // LIKE %value%
        'not_contains', // NOT LIKE %value%
        'starts_with',  // LIKE value%
        'ends_with',    // LIKE %value
        'gt',           // greater than
        'gte',          // greater than or equal
        'lt',           // less than
        'lte',          // less than or equal
        'in',           // IN array
        'not_in',       // NOT IN array
        'days_last',    // within last X days
        'days_next',    // within next X days
        'is_true',      // boolean true
        'is_false',     // boolean false
        'is_null',      // is null
        'is_not_null',  // is not null
        'field_gt',     // compare to another field (greater than)
        'field_gte',    // compare to another field (greater than or equal)
        'field_lt',     // compare to another field (less than)
        'field_lte',    // compare to another field (less than or equal)
    ];

    /**
     * Build a query from rules JSON.
     */
    public function buildQuery(array $rules, ?int $vendorId = null): Builder
    {
        $query = Product::query()->active();

        if ($vendorId) {
            $query->where('seller_id', $vendorId);
        }

        $match = $rules['match'] ?? 'all';
        $conditions = $rules['conditions'] ?? [];

        if (empty($conditions)) {
            return $query;
        }

        if ($match === 'all') {
            foreach ($conditions as $condition) {
                $query = $this->applyCondition($query, $condition, 'and');
            }
        } else {
            $query->where(function ($q) use ($conditions) {
                foreach ($conditions as $condition) {
                    $this->applyCondition($q, $condition, 'or');
                }
            });
        }

        return $query;
    }

    /**
     * Apply a single condition to the query.
     */
    protected function applyCondition(Builder $query, array $condition, string $boolean = 'and'): Builder
    {
        $field = $condition['field'] ?? null;
        $operator = $condition['op'] ?? 'eq';
        $value = $condition['value'] ?? null;

        // Validate field and operator
        if (!$this->isFieldAllowed($field) || !$this->isOperatorAllowed($operator)) {
            return $query;
        }

        // Handle special fields
        if ($field === 'tag') {
            return $this->applyTagCondition($query, $operator, $value, $boolean);
        }

        if ($field === 'category_id') {
            return $this->applyCategoryCondition($query, $operator, $value, $boolean);
        }

        // Map field aliases
        $dbField = $this->mapFieldToColumn($field);

        // Apply operator
        return match ($operator) {
            'eq' => $query->where($dbField, '=', $value, $boolean),
            'neq' => $query->where($dbField, '!=', $value, $boolean),
            'contains' => $query->where($dbField, 'like', "%{$value}%", $boolean),
            'not_contains' => $query->where($dbField, 'not like', "%{$value}%", $boolean),
            'starts_with' => $query->where($dbField, 'like', "{$value}%", $boolean),
            'ends_with' => $query->where($dbField, 'like', "%{$value}", $boolean),
            'gt' => $query->where($dbField, '>', $this->parseNumericValue($value), $boolean),
            'gte' => $query->where($dbField, '>=', $this->parseNumericValue($value), $boolean),
            'lt' => $query->where($dbField, '<', $this->parseNumericValue($value), $boolean),
            'lte' => $query->where($dbField, '<=', $this->parseNumericValue($value), $boolean),
            'in' => $query->whereIn($dbField, (array) $value, $boolean),
            'not_in' => $query->whereNotIn($dbField, (array) $value, $boolean),
            'days_last' => $query->where($dbField, '>=', Carbon::now()->subDays((int) $value), $boolean),
            'days_next' => $query->where($dbField, '<=', Carbon::now()->addDays((int) $value), $boolean),
            'is_true' => $query->where($dbField, '=', true, $boolean),
            'is_false' => $query->where($dbField, '=', false, $boolean),
            'is_null' => $query->whereNull($dbField, $boolean),
            'is_not_null' => $query->whereNotNull($dbField, $boolean),
            'field_gt' => $this->applyFieldComparison($query, $dbField, '>', $value, $boolean),
            'field_gte' => $this->applyFieldComparison($query, $dbField, '>=', $value, $boolean),
            'field_lt' => $this->applyFieldComparison($query, $dbField, '<', $value, $boolean),
            'field_lte' => $this->applyFieldComparison($query, $dbField, '<=', $value, $boolean),
            default => $query,
        };
    }

    /**
     * Apply tag condition (requires join).
     */
    protected function applyTagCondition(Builder $query, string $operator, mixed $value, string $boolean): Builder
    {
        $tags = is_array($value) ? $value : [$value];

        if ($operator === 'in' || $operator === 'eq') {
            return $query->whereHas('productTags', function ($q) use ($tags) {
                $q->whereIn('name', $tags);
            }, boolean: $boolean);
        }

        if ($operator === 'not_in' || $operator === 'neq') {
            return $query->whereDoesntHave('productTags', function ($q) use ($tags) {
                $q->whereIn('name', $tags);
            }, boolean: $boolean);
        }

        if ($operator === 'contains') {
            return $query->whereHas('productTags', function ($q) use ($value) {
                $q->where('name', 'like', "%{$value}%");
            }, boolean: $boolean);
        }

        return $query;
    }

    /**
     * Apply category condition (requires join).
     */
    protected function applyCategoryCondition(Builder $query, string $operator, mixed $value, string $boolean): Builder
    {
        $categoryIds = is_array($value) ? $value : [$value];

        if ($operator === 'in' || $operator === 'eq') {
            return $query->whereHas('categories', function ($q) use ($categoryIds) {
                $q->whereIn('categories.id', $categoryIds);
            }, boolean: $boolean);
        }

        if ($operator === 'not_in' || $operator === 'neq') {
            return $query->whereDoesntHave('categories', function ($q) use ($categoryIds) {
                $q->whereIn('categories.id', $categoryIds);
            }, boolean: $boolean);
        }

        return $query;
    }

    /**
     * Apply field-to-field comparison.
     */
    protected function applyFieldComparison(Builder $query, string $field, string $operator, mixed $compareField, string $boolean): Builder
    {
        // Validate the compare field
        if (!$this->isFieldAllowed($compareField)) {
            return $query;
        }

        $compareColumn = $this->mapFieldToColumn($compareField);

        return $query->whereColumn($field, $operator, $compareColumn, $boolean);
    }

    /**
     * Check if field is allowed.
     */
    protected function isFieldAllowed(?string $field): bool
    {
        return $field !== null && in_array($field, $this->allowedFields, true);
    }

    /**
     * Check if operator is allowed.
     */
    protected function isOperatorAllowed(string $operator): bool
    {
        return in_array($operator, $this->allowedOperators, true);
    }

    /**
     * Map field name to database column.
     */
    protected function mapFieldToColumn(string $field): string
    {
        return match ($field) {
            'title', 'name' => 'products.name',
            'vendor', 'seller_id' => 'products.seller_id',
            'inventory' => 'products.inventory_quantity',
            default => "products.{$field}",
        };
    }

    /**
     * Parse numeric value, handling special keywords.
     */
    protected function parseNumericValue(mixed $value): mixed
    {
        // Handle special keyword 'price' for compare_at_price > price comparisons
        if ($value === 'price') {
            return null; // Will be handled by field comparison
        }

        if (is_numeric($value)) {
            return (float) $value;
        }

        return $value;
    }

    /**
     * Get count of products matching rules without loading them.
     */
    public function getMatchCount(array $rules, ?int $vendorId = null): int
    {
        return $this->buildQuery($rules, $vendorId)->count();
    }

    /**
     * Get preview of matching products.
     */
    public function getPreview(array $rules, ?int $vendorId = null, int $limit = 10): array
    {
        return $this->buildQuery($rules, $vendorId)
            ->with(['category:id,name', 'media' => fn($q) => $q->where('is_primary', true)])
            ->limit($limit)
            ->get(['id', 'name', 'slug', 'price', 'compare_at_price', 'image_url'])
            ->toArray();
    }

    /**
     * Validate rules structure.
     */
    public function validateRules(array $rules): array
    {
        $errors = [];

        if (!isset($rules['match']) || !in_array($rules['match'], ['all', 'any'])) {
            $errors[] = 'Invalid match type. Must be "all" or "any".';
        }

        if (!isset($rules['conditions']) || !is_array($rules['conditions'])) {
            $errors[] = 'Conditions must be an array.';
            return $errors;
        }

        foreach ($rules['conditions'] as $index => $condition) {
            if (!isset($condition['field'])) {
                $errors[] = "Condition {$index}: Missing field.";
                continue;
            }

            if (!$this->isFieldAllowed($condition['field'])) {
                $errors[] = "Condition {$index}: Invalid field '{$condition['field']}'.";
            }

            if (!isset($condition['op']) || !$this->isOperatorAllowed($condition['op'])) {
                $errors[] = "Condition {$index}: Invalid operator.";
            }
        }

        return $errors;
    }

    /**
     * Get available fields for UI.
     */
    public static function getAvailableFields(): array
    {
        return [
            ['key' => 'name', 'label' => 'Product Title', 'type' => 'text'],
            ['key' => 'tag', 'label' => 'Product Tag', 'type' => 'tag'],
            ['key' => 'category_id', 'label' => 'Category', 'type' => 'category'],
            ['key' => 'product_type', 'label' => 'Product Type', 'type' => 'text'],
            ['key' => 'brand', 'label' => 'Brand', 'type' => 'text'],
            ['key' => 'seller_id', 'label' => 'Vendor', 'type' => 'vendor'],
            ['key' => 'price', 'label' => 'Price', 'type' => 'number'],
            ['key' => 'compare_at_price', 'label' => 'Compare at Price', 'type' => 'number'],
            ['key' => 'inventory_quantity', 'label' => 'Inventory', 'type' => 'number'],
            ['key' => 'created_at', 'label' => 'Created Date', 'type' => 'date'],
            ['key' => 'published_at', 'label' => 'Published Date', 'type' => 'date'],
            ['key' => 'status', 'label' => 'Status', 'type' => 'select', 'options' => ['draft', 'published', 'scheduled', 'archived']],
            ['key' => 'is_active', 'label' => 'Active', 'type' => 'boolean'],
        ];
    }

    /**
     * Get available operators for UI.
     */
    public static function getAvailableOperators(): array
    {
        return [
            ['key' => 'eq', 'label' => 'equals', 'types' => ['text', 'number', 'select', 'tag', 'category', 'vendor']],
            ['key' => 'neq', 'label' => 'not equals', 'types' => ['text', 'number', 'select', 'tag', 'category', 'vendor']],
            ['key' => 'contains', 'label' => 'contains', 'types' => ['text', 'tag']],
            ['key' => 'not_contains', 'label' => 'does not contain', 'types' => ['text', 'tag']],
            ['key' => 'starts_with', 'label' => 'starts with', 'types' => ['text']],
            ['key' => 'ends_with', 'label' => 'ends with', 'types' => ['text']],
            ['key' => 'gt', 'label' => 'greater than', 'types' => ['number']],
            ['key' => 'gte', 'label' => 'greater than or equal', 'types' => ['number']],
            ['key' => 'lt', 'label' => 'less than', 'types' => ['number']],
            ['key' => 'lte', 'label' => 'less than or equal', 'types' => ['number']],
            ['key' => 'in', 'label' => 'is one of', 'types' => ['text', 'select', 'tag', 'category', 'vendor']],
            ['key' => 'not_in', 'label' => 'is not one of', 'types' => ['text', 'select', 'tag', 'category', 'vendor']],
            ['key' => 'days_last', 'label' => 'within last X days', 'types' => ['date']],
            ['key' => 'is_true', 'label' => 'is true', 'types' => ['boolean']],
            ['key' => 'is_false', 'label' => 'is false', 'types' => ['boolean']],
            ['key' => 'field_gt', 'label' => 'is greater than field', 'types' => ['number']],
        ];
    }

    /**
     * Get preset rule templates.
     */
    public static function getPresets(): array
    {
        return [
            [
                'key' => 'new_arrivals',
                'label' => 'New Arrivals (Last 30 Days)',
                'rules' => [
                    'match' => 'all',
                    'conditions' => [
                        ['field' => 'created_at', 'op' => 'days_last', 'value' => 30],
                    ],
                ],
            ],
            [
                'key' => 'on_sale',
                'label' => 'On Sale (Has Compare Price)',
                'rules' => [
                    'match' => 'all',
                    'conditions' => [
                        ['field' => 'compare_at_price', 'op' => 'field_gt', 'value' => 'price'],
                    ],
                ],
            ],
            [
                'key' => 'low_stock',
                'label' => 'Low Stock (< 10 units)',
                'rules' => [
                    'match' => 'all',
                    'conditions' => [
                        ['field' => 'inventory_quantity', 'op' => 'lt', 'value' => 10],
                        ['field' => 'inventory_quantity', 'op' => 'gt', 'value' => 0],
                    ],
                ],
            ],
            [
                'key' => 'out_of_stock',
                'label' => 'Out of Stock',
                'rules' => [
                    'match' => 'all',
                    'conditions' => [
                        ['field' => 'inventory_quantity', 'op' => 'lte', 'value' => 0],
                    ],
                ],
            ],
        ];
    }
}
