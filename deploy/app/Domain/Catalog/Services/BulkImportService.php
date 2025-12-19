<?php

namespace App\Domain\Catalog\Services;

use App\Domain\Catalog\Models\BulkImportJob;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use League\Csv\Reader;
use ZipArchive;

class BulkImportService
{
    protected ProductService $productService;
    protected MediaService $mediaService;
    protected TagService $tagService;

    public function __construct(
        ProductService $productService,
        MediaService $mediaService,
        TagService $tagService
    ) {
        $this->productService = $productService;
        $this->mediaService = $mediaService;
        $this->tagService = $tagService;
    }

    /**
     * Create a new bulk import job.
     */
    public function createJob(UploadedFile $file, string $type, User $user, ?int $vendorId = null): BulkImportJob
    {
        // Store the file
        $path = $file->store('imports', 'local');

        $job = BulkImportJob::create([
            'vendor_id' => $vendorId ?? ($user->hasRole('seller') ? $user->id : null),
            'type' => $type,
            'status' => BulkImportJob::STATUS_QUEUED,
            'total' => 0,
            'processed' => 0,
            'failed' => 0,
            'result_json' => ['file_path' => $path],
            'created_by' => $user->id,
        ]);

        return $job;
    }

    /**
     * Process a bulk import job.
     */
    public function processJob(BulkImportJob $job): void
    {
        $job->markRunning();

        try {
            $filePath = Storage::disk('local')->path($job->result_json['file_path'] ?? '');

            switch ($job->type) {
                case BulkImportJob::TYPE_PRODUCTS_CSV:
                    $this->processProductsCsv($job, $filePath);
                    break;
                case BulkImportJob::TYPE_MEDIA_ZIP:
                    $this->processMediaZip($job, $filePath);
                    break;
                case BulkImportJob::TYPE_PRICE_UPDATE_CSV:
                    $this->processPriceUpdateCsv($job, $filePath);
                    break;
            }

            $job->markCompleted($job->result_json);
        } catch (\Exception $e) {
            Log::error('Bulk import failed', [
                'job_id' => $job->id,
                'error' => $e->getMessage(),
            ]);
            $job->markFailed($e->getMessage());
        }
    }

    /**
     * Process products CSV import.
     */
    protected function processProductsCsv(BulkImportJob $job, string $filePath): void
    {
        $csv = Reader::createFromPath($filePath, 'r');
        $csv->setHeaderOffset(0);

        $records = $csv->getRecords();
        $total = iterator_count($csv->getRecords());
        $job->update(['total' => $total]);

        $user = User::find($job->created_by);
        $errors = [];
        $created = 0;
        $updated = 0;

        foreach ($records as $offset => $record) {
            try {
                $result = $this->importProductRow($record, $job->vendor_id, $user);

                if ($result['action'] === 'created') {
                    $created++;
                } else {
                    $updated++;
                }

                $job->incrementProcessed();
            } catch (\Exception $e) {
                $job->incrementFailed();
                $errors[] = [
                    'row' => $offset + 2, // +2 for header row and 0-index
                    'error' => $e->getMessage(),
                    'data' => array_slice($record, 0, 3),
                ];
            }
        }

        $job->update([
            'result_json' => array_merge($job->result_json ?? [], [
                'created' => $created,
                'updated' => $updated,
                'errors' => array_slice($errors, 0, 100), // Limit error log
            ]),
        ]);
    }

    /**
     * Import a single product row.
     */
    protected function importProductRow(array $row, ?int $vendorId, User $user): array
    {
        // Normalize column names
        $data = $this->normalizeRowData($row);

        // Check for existing product by SKU
        $existingProduct = null;
        if (!empty($data['sku'])) {
            $existingProduct = Product::where('sku', $data['sku'])
                ->when($vendorId, fn ($q) => $q->where('seller_id', $vendorId))
                ->first();
        }

        // Prepare product data
        $productData = [
            'name' => $data['name'] ?? $data['title'] ?? '',
            'sku' => $data['sku'] ?? null,
            'short_description' => $data['short_description'] ?? null,
            'description' => $data['description'] ?? null,
            'brand' => $data['brand'] ?? null,
            'product_type' => $data['product_type'] ?? $data['type'] ?? null,
            'price' => $this->parsePrice($data['price'] ?? 0),
            'compare_at_price' => $this->parsePrice($data['compare_at_price'] ?? $data['compare_price'] ?? null),
            'cost' => $this->parsePrice($data['cost'] ?? $data['cost_price'] ?? null),
            'weight_grams' => $data['weight_grams'] ?? $data['weight'] ?? null,
            'status' => $data['status'] ?? Product::STATUS_DRAFT,
            'is_digital' => $this->parseBool($data['is_digital'] ?? false),
            'requires_shipping' => $this->parseBool($data['requires_shipping'] ?? true),
            'seller_id' => $vendorId,
        ];

        // Handle categories
        if (!empty($data['categories']) || !empty($data['category'])) {
            $categoryNames = $data['categories'] ?? $data['category'] ?? '';
            $categoryIds = $this->resolveCategoryIds($categoryNames);
            $productData['category_ids'] = $categoryIds;
        }

        // Handle tags
        if (!empty($data['tags'])) {
            $tagNames = array_map('trim', explode(',', $data['tags']));
            $productData['tags'] = $tagNames;
        }

        if ($existingProduct) {
            $this->productService->updateProduct($existingProduct, $productData, $user);
            return ['action' => 'updated', 'product_id' => $existingProduct->id];
        } else {
            $product = $this->productService->createProduct($productData, $user);
            return ['action' => 'created', 'product_id' => $product->id];
        }
    }

    /**
     * Normalize CSV row data (handle different column naming conventions).
     */
    protected function normalizeRowData(array $row): array
    {
        $normalized = [];

        foreach ($row as $key => $value) {
            $normalizedKey = Str::snake(Str::lower(trim($key)));
            $normalizedKey = str_replace([' ', '-'], '_', $normalizedKey);
            $normalized[$normalizedKey] = trim($value);
        }

        return $normalized;
    }

    /**
     * Parse price value.
     */
    protected function parsePrice($value): ?float
    {
        if (empty($value)) {
            return null;
        }

        // Remove currency symbols and commas
        $cleaned = preg_replace('/[^0-9.]/', '', (string) $value);

        return $cleaned ? (float) $cleaned : null;
    }

    /**
     * Parse boolean value.
     */
    protected function parseBool($value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        $value = Str::lower(trim((string) $value));

        return in_array($value, ['true', 'yes', '1', 'y'], true);
    }

    /**
     * Resolve category IDs from names.
     */
    protected function resolveCategoryIds(string $categoryNames): array
    {
        if (empty($categoryNames)) {
            return [];
        }

        $names = array_map('trim', explode(',', $categoryNames));
        $ids = [];

        foreach ($names as $name) {
            $category = Category::where('name', $name)
                ->orWhere('slug', Str::slug($name))
                ->first();

            if ($category) {
                $ids[] = $category->id;
            }
        }

        return $ids;
    }

    /**
     * Process media ZIP import.
     */
    protected function processMediaZip(BulkImportJob $job, string $filePath): void
    {
        $zip = new ZipArchive();

        if ($zip->open($filePath) !== true) {
            throw new \Exception('Failed to open ZIP file');
        }

        $total = $zip->numFiles;
        $job->update(['total' => $total]);

        $matched = 0;
        $notMatched = [];

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $filename = $zip->getNameIndex($i);

            // Skip directories
            if (Str::endsWith($filename, '/')) {
                $job->incrementProcessed();
                continue;
            }

            try {
                $result = $this->processZipMedia($zip, $filename, $job->vendor_id);

                if ($result) {
                    $matched++;
                } else {
                    $notMatched[] = $filename;
                }

                $job->incrementProcessed();
            } catch (\Exception $e) {
                $job->incrementFailed();
            }
        }

        $zip->close();

        $job->update([
            'result_json' => array_merge($job->result_json ?? [], [
                'matched' => $matched,
                'not_matched' => array_slice($notMatched, 0, 100),
            ]),
        ]);
    }

    /**
     * Process a single media file from ZIP.
     */
    protected function processZipMedia(ZipArchive $zip, string $filename, ?int $vendorId): bool
    {
        // Try to match product by SKU from filename
        // Expected format: SKU_001.jpg or SKU-001.jpg or SKU.jpg
        $basename = pathinfo($filename, PATHINFO_FILENAME);
        $parts = preg_split('/[-_]/', $basename);
        $sku = $parts[0];

        $product = Product::where('sku', $sku)
            ->when($vendorId, fn ($q) => $q->where('seller_id', $vendorId))
            ->first();

        if (!$product) {
            return false;
        }

        // Extract and store the file
        $content = $zip->getFromName($filename);
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $newFilename = Str::uuid() . '.' . $extension;
        $path = "products/{$product->id}/images/{$newFilename}";

        Storage::disk('public')->put($path, $content);

        // Create media record
        $product->media()->create([
            'type' => 'image',
            'path' => $path,
            'filename' => basename($filename),
            'mime_type' => $this->getMimeType($extension),
            'size_bytes' => strlen($content),
            'sort_order' => $product->media()->count(),
            'is_primary' => !$product->media()->where('is_primary', true)->exists(),
        ]);

        return true;
    }

    /**
     * Get MIME type from extension.
     */
    protected function getMimeType(string $extension): string
    {
        $mimes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
        ];

        return $mimes[Str::lower($extension)] ?? 'application/octet-stream';
    }

    /**
     * Process price update CSV.
     */
    protected function processPriceUpdateCsv(BulkImportJob $job, string $filePath): void
    {
        $csv = Reader::createFromPath($filePath, 'r');
        $csv->setHeaderOffset(0);

        $records = $csv->getRecords();
        $total = iterator_count($csv->getRecords());
        $job->update(['total' => $total]);

        $updated = 0;
        $errors = [];

        foreach ($records as $offset => $record) {
            try {
                $data = $this->normalizeRowData($record);
                $sku = $data['sku'] ?? null;

                if (!$sku) {
                    throw new \Exception('SKU is required');
                }

                $product = Product::where('sku', $sku)
                    ->when($job->vendor_id, fn ($q) => $q->where('seller_id', $job->vendor_id))
                    ->first();

                if (!$product) {
                    throw new \Exception("Product with SKU {$sku} not found");
                }

                $updateData = [];

                if (isset($data['price'])) {
                    $updateData['price'] = $this->parsePrice($data['price']);
                }
                if (isset($data['compare_at_price']) || isset($data['compare_price'])) {
                    $updateData['compare_at_price'] = $this->parsePrice($data['compare_at_price'] ?? $data['compare_price']);
                }
                if (isset($data['cost']) || isset($data['cost_price'])) {
                    $updateData['cost'] = $this->parsePrice($data['cost'] ?? $data['cost_price']);
                }

                if (!empty($updateData)) {
                    $product->update($updateData);

                    // Also update default variant
                    $defaultVariant = $product->variants()->where('is_default', true)->first();
                    if ($defaultVariant) {
                        $defaultVariant->update($updateData);
                    }

                    $updated++;
                }

                $job->incrementProcessed();
            } catch (\Exception $e) {
                $job->incrementFailed();
                $errors[] = [
                    'row' => $offset + 2,
                    'error' => $e->getMessage(),
                ];
            }
        }

        $job->update([
            'result_json' => array_merge($job->result_json ?? [], [
                'updated' => $updated,
                'errors' => array_slice($errors, 0, 100),
            ]),
        ]);
    }

    /**
     * Generate a CSV template for product import.
     */
    public function generateCsvTemplate(): string
    {
        $headers = [
            'name',
            'sku',
            'short_description',
            'description',
            'brand',
            'product_type',
            'price',
            'compare_at_price',
            'cost',
            'weight_grams',
            'categories',
            'tags',
            'status',
            'is_digital',
            'requires_shipping',
        ];

        $exampleRow = [
            'Example Product',
            'SKU-001',
            'Short description here',
            'Full product description',
            'Brand Name',
            'Physical',
            '29.99',
            '39.99',
            '15.00',
            '500',
            'Category 1, Category 2',
            'tag1, tag2, tag3',
            'draft',
            'false',
            'true',
        ];

        $csv = implode(',', $headers) . "\n";
        $csv .= implode(',', array_map(fn ($v) => '"' . str_replace('"', '""', $v) . '"', $exampleRow));

        return $csv;
    }

    /**
     * Get job progress.
     */
    public function getJobProgress(BulkImportJob $job): array
    {
        return [
            'id' => $job->id,
            'status' => $job->status,
            'total' => $job->total,
            'processed' => $job->processed,
            'failed' => $job->failed,
            'percentage' => $job->getProgressPercentage(),
            'result' => $job->result_json,
            'error' => $job->error_text,
        ];
    }
}
