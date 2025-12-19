<?php

namespace App\Domain\Catalog\Services;

use App\Domain\Catalog\Models\ProductMedia;
use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaService
{
    protected array $imageValidation = [
        'max_size' => 10 * 1024 * 1024, // 10MB
        'allowed_types' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        'max_width' => 4096,
        'max_height' => 4096,
    ];

    protected array $videoValidation = [
        'max_size' => 100 * 1024 * 1024, // 100MB
        'allowed_types' => ['video/mp4', 'video/webm', 'video/quicktime'],
        'max_duration' => 300, // 5 minutes
    ];

    /**
     * Upload and store product media files.
     */
    public function storeMedia(Product $product, array $files, string $type = 'image'): array
    {
        $storedMedia = [];

        foreach ($files as $index => $file) {
            if (!$file instanceof UploadedFile) {
                continue;
            }

            $validation = $type === 'video' ? $this->videoValidation : $this->imageValidation;
            $errors = $this->validateFile($file, $validation);

            if (!empty($errors)) {
                $storedMedia[] = ['error' => $errors, 'filename' => $file->getClientOriginalName()];
                continue;
            }

            $media = $this->storeSingleFile($product, $file, $type);
            $storedMedia[] = $media;
        }

        return $storedMedia;
    }

    /**
     * Store a single media file.
     */
    protected function storeSingleFile(Product $product, UploadedFile $file, string $type): ProductMedia
    {
        $directory = "products/{$product->id}/{$type}s";
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs($directory, $filename, 'public');

        $mediaData = [
            'product_id' => $product->id,
            'type' => $type,
            'path' => $path,
            'filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
            'sort_order' => $this->getNextSortOrder($product, $type),
            'is_primary' => $this->shouldBePrimary($product, $type),
        ];

        // Get image dimensions
        if ($type === 'image') {
            $dimensions = getimagesize($file->getRealPath());
            if ($dimensions) {
                $mediaData['width'] = $dimensions[0];
                $mediaData['height'] = $dimensions[1];
            }
        }

        // For videos, get duration if possible (requires ffprobe)
        if ($type === 'video') {
            $mediaData['duration_seconds'] = $this->getVideoDuration($file->getRealPath());
        }

        return ProductMedia::create($mediaData);
    }

    /**
     * Validate a file against rules.
     */
    protected function validateFile(UploadedFile $file, array $rules): array
    {
        $errors = [];

        if ($file->getSize() > $rules['max_size']) {
            $maxMb = $rules['max_size'] / 1024 / 1024;
            $errors[] = "File size exceeds maximum of {$maxMb}MB";
        }

        if (!in_array($file->getMimeType(), $rules['allowed_types'])) {
            $errors[] = "File type {$file->getMimeType()} is not allowed";
        }

        // Check image dimensions
        if (isset($rules['max_width']) && isset($rules['max_height'])) {
            $dimensions = getimagesize($file->getRealPath());
            if ($dimensions) {
                if ($dimensions[0] > $rules['max_width']) {
                    $errors[] = "Image width exceeds maximum of {$rules['max_width']}px";
                }
                if ($dimensions[1] > $rules['max_height']) {
                    $errors[] = "Image height exceeds maximum of {$rules['max_height']}px";
                }
            }
        }

        return $errors;
    }

    /**
     * Get next sort order for media.
     */
    protected function getNextSortOrder(Product $product, string $type): int
    {
        return ProductMedia::where('product_id', $product->id)
            ->where('type', $type)
            ->max('sort_order') + 1;
    }

    /**
     * Check if this should be the primary media.
     */
    protected function shouldBePrimary(Product $product, string $type): bool
    {
        return !ProductMedia::where('product_id', $product->id)
            ->where('type', $type)
            ->where('is_primary', true)
            ->exists();
    }

    /**
     * Get video duration using ffprobe if available.
     */
    protected function getVideoDuration(string $path): ?int
    {
        if (!function_exists('shell_exec')) {
            return null;
        }

        $output = shell_exec("ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 " . escapeshellarg($path) . " 2>&1");

        if ($output && is_numeric(trim($output))) {
            return (int) round((float) trim($output));
        }

        return null;
    }

    /**
     * Delete a media file.
     */
    public function deleteMedia(ProductMedia $media): bool
    {
        $wasPrimary = $media->is_primary;
        $productId = $media->product_id;
        $type = $media->type;

        // Delete file from storage
        if ($media->path) {
            Storage::disk('public')->delete($media->path);
        }

        // Delete poster if video
        if ($media->poster_path) {
            Storage::disk('public')->delete($media->poster_path);
        }

        $media->delete();

        // If it was primary, set next media as primary
        if ($wasPrimary) {
            $nextMedia = ProductMedia::where('product_id', $productId)
                ->where('type', $type)
                ->orderBy('sort_order')
                ->first();

            if ($nextMedia) {
                $nextMedia->update(['is_primary' => true]);
            }
        }

        return true;
    }

    /**
     * Set media as primary.
     */
    public function setPrimary(ProductMedia $media): ProductMedia
    {
        DB::transaction(function () use ($media) {
            // Remove primary from all other media of same type
            ProductMedia::where('product_id', $media->product_id)
                ->where('type', $media->type)
                ->where('id', '!=', $media->id)
                ->update(['is_primary' => false]);

            $media->update(['is_primary' => true]);
        });

        return $media->fresh();
    }

    /**
     * Reorder media items.
     */
    public function reorder(Product $product, array $mediaIds): void
    {
        DB::transaction(function () use ($product, $mediaIds) {
            foreach ($mediaIds as $index => $id) {
                ProductMedia::where('id', $id)
                    ->where('product_id', $product->id)
                    ->update(['sort_order' => $index]);
            }
        });
    }

    /**
     * Update media alt text.
     */
    public function updateAltText(ProductMedia $media, ?string $altText): ProductMedia
    {
        $media->update(['alt_text' => $altText]);
        return $media;
    }

    /**
     * Upload a video poster image.
     */
    public function uploadPoster(ProductMedia $media, UploadedFile $file): ProductMedia
    {
        if ($media->type !== 'video') {
            throw new \InvalidArgumentException('Poster can only be uploaded for video media');
        }

        $errors = $this->validateFile($file, $this->imageValidation);
        if (!empty($errors)) {
            throw new \InvalidArgumentException(implode(', ', $errors));
        }

        // Delete old poster if exists
        if ($media->poster_path) {
            Storage::disk('public')->delete($media->poster_path);
        }

        $directory = "products/{$media->product_id}/posters";
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs($directory, $filename, 'public');

        $media->update(['poster_path' => $path]);

        return $media->fresh();
    }

    /**
     * Get all media for a product grouped by type.
     */
    public function getMediaByType(Product $product): array
    {
        $media = ProductMedia::where('product_id', $product->id)
            ->orderBy('type')
            ->orderBy('sort_order')
            ->get();

        return [
            'images' => $media->where('type', 'image')->values(),
            'videos' => $media->where('type', 'video')->values(),
        ];
    }
}
