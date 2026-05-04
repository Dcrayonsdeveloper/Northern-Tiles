<?php

namespace App\Http\Controllers\Admin;

use App\Domain\Catalog\Http\Requests\BulkImportRequest;
use App\Domain\Catalog\Http\Requests\StoreProductRequest;
use App\Domain\Catalog\Http\Requests\UpdateProductRequest;
use App\Domain\Catalog\Http\Requests\UpdateProductStatusRequest;
use App\Domain\Catalog\Http\Requests\UploadProductMediaRequest;
use App\Domain\Catalog\Models\BulkImportJob;
use App\Domain\Catalog\Models\Collection;
use App\Domain\Catalog\Models\ProductMedia;
use App\Domain\Catalog\Models\Tag;
use App\Domain\Catalog\Services\BulkImportService;
use App\Domain\Catalog\Services\MediaService;
use App\Domain\Catalog\Services\ProductService;
use App\Domain\Catalog\Services\TagService;
use App\Domain\Catalog\Services\VariantService;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        protected ProductService $productService,
        protected MediaService $mediaService,
        protected VariantService $variantService,
        protected TagService $tagService,
        protected BulkImportService $bulkImportService,
    ) {}

    /**
     * List all products with filtering.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'category_id', 'vendor_id', 'sort', 'dir']);
        $products = $this->productService->getProducts($filters, null, 20);

        $categories = Category::query()->active()->orderBy('name')->get(['id', 'name', 'slug']);
        $vendors = User::query()->where('is_seller', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'filters' => $filters,
            'categories' => $categories,
            'vendors' => $vendors,
            'statuses' => [
                ['value' => Product::STATUS_DRAFT, 'label' => 'Draft'],
                ['value' => Product::STATUS_PUBLISHED, 'label' => 'Published'],
                ['value' => Product::STATUS_SCHEDULED, 'label' => 'Scheduled'],
                ['value' => Product::STATUS_ARCHIVED, 'label' => 'Archived'],
            ],
        ]);
    }

    /**
     * Show create product form.
     */
    public function create(): Response
    {
        $categories = Category::query()->active()->with('parent')->orderBy('name')->get();
        $vendors = User::query()->where('is_seller', true)->orderBy('name')->get(['id', 'name']);
        $popularTags = $this->tagService->getPopularTags(30);

        return Inertia::render('Admin/Products/Create', [
            'categories' => $this->buildCategoryTree($categories),
            'vendors' => $vendors,
            'popularTags' => $popularTags,
            'statuses' => [
                ['value' => Product::STATUS_DRAFT, 'label' => 'Draft'],
                ['value' => Product::STATUS_PUBLISHED, 'label' => 'Published'],
                ['value' => Product::STATUS_SCHEDULED, 'label' => 'Scheduled'],
            ],
        ]);
    }

    /**
     * Store a new product.
     */
    public function store(StoreProductRequest $request): RedirectResponse
    {
        $product = $this->productService->createProduct(
            $request->validated(),
            $request->user()
        );

        // Handle options and variants
        if ($request->has('options') && !empty($request->options)) {
            $this->variantService->syncOptions($product, $request->options);
            $this->variantService->createVariantsFromCombinations($product, $request->validated());
        }

        return redirect()
            ->route('admin.products.edit', $product)
            ->with('success', 'Product created successfully.');
    }

    /**
     * Show product edit form.
     */
    public function edit(Product $product): Response
    {
        $product = $this->productService->getProductForEdit($product->id);
        $categories = Category::query()->active()->with('parent')->orderBy('name')->get();
        $vendors = User::query()->where('is_seller', true)->orderBy('name')->get(['id', 'name']);
        $popularTags = $this->tagService->getPopularTags(30);

        // Get all collections for the dropdown
        $collections = Collection::query()
            ->where('is_active', true)
            ->orderBy('title')
            ->get(['id', 'title', 'type']);

        // Get collections this product belongs to
        $productCollections = $product->collections()
            ->select(['collections.id', 'title', 'type'])
            ->get();

        return Inertia::render('Admin/Products/Edit', [
            'product' => $this->transformProductForEditor($product),
            'categories' => $this->buildCategoryTree($categories),
            'vendors' => $vendors,
            'popularTags' => $popularTags,
            'collections' => $collections,
            'productCollections' => $productCollections,
            'statuses' => [
                ['value' => Product::STATUS_DRAFT, 'label' => 'Draft'],
                ['value' => Product::STATUS_PUBLISHED, 'label' => 'Published'],
                ['value' => Product::STATUS_SCHEDULED, 'label' => 'Scheduled'],
                ['value' => Product::STATUS_ARCHIVED, 'label' => 'Archived'],
            ],
        ]);
    }

    /**
     * Update a product.
     */
    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $this->productService->updateProduct($product, $request->validated(), $request->user());

        // Handle options and variants updates
        if ($request->has('options')) {
            $this->variantService->syncOptions($product, $request->options);
        }

        if ($request->has('variants')) {
            $this->variantService->bulkUpdateVariants($product, $request->variants);
        }

        return redirect()
            ->route('admin.products.edit', $product)
            ->with('success', 'Product updated successfully.');
    }

    /**
     * Delete a product.
     */
    public function destroy(Product $product): RedirectResponse
    {
        $this->productService->deleteProduct($product);

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product deleted successfully.');
    }

    /**
     * Duplicate a product.
     */
    public function duplicate(Product $product, Request $request): RedirectResponse
    {
        $newProduct = $this->productService->duplicateProduct($product, $request->user());

        return redirect()
            ->route('admin.products.edit', $newProduct)
            ->with('success', 'Product duplicated successfully.');
    }

    /**
     * Update product status.
     */
    public function updateStatus(UpdateProductStatusRequest $request, Product $product): RedirectResponse|JsonResponse
    {
        $this->productService->updateStatus(
            $product,
            $request->status,
            $request->published_at
        );

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return redirect()
            ->back()
            ->with('success', 'Product status updated successfully.');
    }

    /**
     * Upload product media.
     */
    public function uploadMedia(UploadProductMediaRequest $request, Product $product): JsonResponse
    {
        $type = $request->input('type', 'image');
        $files = $request->file('files');

        $results = $this->mediaService->storeMedia($product, $files, $type);

        return response()->json([
            'success' => true,
            'media' => $results,
        ]);
    }

    /**
     * Delete product media.
     */
    public function deleteMedia(Product $product, ProductMedia $media): JsonResponse
    {
        if ($media->product_id !== $product->id) {
            return response()->json(['error' => 'Media not found'], 404);
        }

        $this->mediaService->deleteMedia($media);

        return response()->json(['success' => true]);
    }

    /**
     * Reorder product media.
     */
    public function reorderMedia(Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'media_ids' => ['required', 'array'],
            'media_ids.*' => ['exists:product_media,id'],
        ]);

        $this->mediaService->reorder($product, $request->media_ids);

        return response()->json(['success' => true]);
    }

    /**
     * Set primary media.
     */
    public function setPrimaryMedia(Product $product, ProductMedia $media): JsonResponse
    {
        if ($media->product_id !== $product->id) {
            return response()->json(['error' => 'Media not found'], 404);
        }

        $this->mediaService->setPrimary($media);

        return response()->json(['success' => true]);
    }

    /**
     * Generate variants from options.
     */
    public function generateVariants(Request $request, Product $product): JsonResponse
    {
        $this->variantService->syncOptions($product, $request->options ?? []);
        $variants = $this->variantService->createVariantsFromCombinations($product, $request->all());

        return response()->json([
            'success' => true,
            'variants' => $variants,
        ]);
    }

    /**
     * Update a single variant field inline.
     */
    public function updateVariant(Request $request, Product $product, int $variant): JsonResponse
    {
        $variantModel = $product->variants()->findOrFail($variant);
        $allowed = ['sku', 'price', 'inventory_quantity', 'barcode', 'compare_at_price', 'cost', 'weight_grams'];
        $variantModel->update($request->only($allowed));

        return response()->json(['success' => true]);
    }

    /**
     * Search tags for autocomplete.
     */
    public function searchTags(Request $request): JsonResponse
    {
        $query = $request->input('q', '');
        $tags = $this->tagService->searchTags($query, 20);

        return response()->json($tags);
    }

    /**
     * Bulk import products.
     */
    public function bulkImport(BulkImportRequest $request): RedirectResponse|JsonResponse
    {
        $job = $this->bulkImportService->createJob(
            $request->file('file'),
            $request->type,
            $request->user(),
            $request->vendor_id
        );

        // Dispatch job for processing (would normally use queue)
        // For now, process synchronously for simplicity
        $this->bulkImportService->processJob($job);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'job' => $this->bulkImportService->getJobProgress($job),
            ]);
        }

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Import completed. Check the results for details.');
    }

    /**
     * Get bulk import job status.
     */
    public function bulkImportStatus(BulkImportJob $job): JsonResponse
    {
        return response()->json($this->bulkImportService->getJobProgress($job));
    }

    /**
     * Download CSV template for bulk import.
     */
    public function downloadTemplate(): \Symfony\Component\HttpFoundation\Response
    {
        $csv = $this->bulkImportService->generateCsvTemplate();

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="product_import_template.csv"',
        ]);
    }

    /**
     * Autosave product draft.
     */
    public function autosave(Request $request, Product $product): JsonResponse
    {
        $data = $request->only([
            'name', 'description', 'description_json', 'short_description',
            'price', 'compare_at_price', 'cost', 'tags',
        ]);

        $this->productService->updateProduct($product, $data, $request->user());

        return response()->json([
            'success' => true,
            'saved_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Bulk delete products.
     */
    public function bulkDelete(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['exists:products,id'],
        ]);

        Product::whereIn('id', $request->ids)->delete();

        return redirect()
            ->route('admin.products.index')
            ->with('success', count($request->ids) . ' products deleted successfully.');
    }

    /**
     * Bulk update product status.
     */
    public function bulkStatus(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['exists:products,id'],
            'status' => ['required', 'in:draft,published,archived'],
        ]);

        Product::whereIn('id', $request->ids)->update([
            'status' => $request->status,
            'published_at' => $request->status === 'published' ? now() : null,
        ]);

        return redirect()
            ->route('admin.products.index')
            ->with('success', count($request->ids) . ' products updated successfully.');
    }

    /**
     * Transform product for editor.
     */
    protected function transformProductForEditor(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'sku' => $product->sku,
            'short_description' => $product->short_description,
            'description' => $product->description,
            'description_json' => $product->description_json,
            'brand' => $product->brand,
            'product_type' => $product->product_type,
            'is_digital' => $product->is_digital,
            'requires_shipping' => $product->requires_shipping,

            // Pricing
            'price' => $product->price,
            'compare_at_price' => $product->compare_at_price,
            'cost' => $product->cost,
            'default_currency' => $product->default_currency,

            // Inventory
            'inventory_quantity' => $product->inventory_quantity,
            'inventory_policy' => $product->inventory_policy,

            // Dimensions
            'weight' => $product->weight,
            'length_mm' => $product->length_mm,
            'width_mm' => $product->width_mm,
            'height_mm' => $product->height_mm,
            'sqm_per_box' => $product->sqm_per_box,

            // Status
            'status' => $product->status,
            'published_at' => $product->published_at?->toIso8601String(),
            'is_active' => $product->is_active,

            // SEO
            'meta_title' => $product->meta_title,
            'meta_description' => $product->meta_description,
            'canonical_url' => $product->canonical_url,
            'og_image_path' => $product->og_image_path,
            'noindex' => $product->noindex,

            // Relations
            'category_id' => $product->category_id,
            'category_ids' => $product->categories->pluck('id'),
            'categories' => $product->categories,
            'seller_id' => $product->seller_id,
            'seller' => $product->seller,

            // Media
            'media' => $product->media->map(fn ($m) => [
                'id' => $m->id,
                'type' => $m->type,
                'url' => $m->url,
                'filename' => $m->filename,
                'is_primary' => $m->is_primary,
                'alt_text' => $m->alt_text,
                'sort_order' => $m->sort_order,
            ]),

            // Options and variants
            'options' => $product->options->map(fn ($o) => [
                'id' => $o->id,
                'name' => $o->name,
                'position' => $o->position,
                'values' => $o->values->map(fn ($v) => [
                    'id' => $v->id,
                    'value' => $v->value,
                    'position' => $v->position,
                    'meta' => $v->meta_json,
                ]),
            ]),
            'variants' => $product->variants->map(fn ($v) => [
                'id' => $v->id,
                'name' => $v->name,
                'sku' => $v->sku,
                'barcode' => $v->barcode,
                'price' => $v->price,
                'compare_at_price' => $v->compare_at_price,
                'cost' => $v->cost,
                'inventory_quantity' => $v->inventory_quantity,
                'inventory_policy' => $v->inventory_policy,
                'track_inventory' => $v->track_inventory,
                'requires_shipping' => $v->requires_shipping,
                'weight_grams' => $v->weight_grams,
                'length_mm' => $v->length_mm,
                'width_mm' => $v->width_mm,
                'height_mm' => $v->height_mm,
                'is_active' => $v->is_active,
                'is_default' => $v->is_default,
                'option_value_ids' => $v->optionValues->pluck('id'),
                'image_url' => $v->image_url,
            ]),

            // Tags
            'tags' => $product->productTags->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'source' => $t->pivot->source ?? 'manual',
                'confidence' => $t->pivot->confidence,
            ]),

            // Digital files
            'digital_files' => $product->digitalFiles->map(fn ($f) => [
                'id' => $f->id,
                'filename' => $f->filename,
                'max_downloads' => $f->max_downloads,
                'expires_days' => $f->expires_days,
            ]),

            // Timestamps
            'created_at' => $product->created_at?->toIso8601String(),
            'updated_at' => $product->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Build category tree for select.
     */
    protected function buildCategoryTree($categories): array
    {
        $result = [];

        foreach ($categories as $category) {
            $depth = $category->getDepth();
            $prefix = str_repeat('— ', $depth);

            $result[] = [
                'id' => $category->id,
                'name' => $prefix . $category->name,
                'slug' => $category->slug,
                'parent_id' => $category->parent_id,
                'depth' => $depth,
            ];
        }

        return $result;
    }
}
