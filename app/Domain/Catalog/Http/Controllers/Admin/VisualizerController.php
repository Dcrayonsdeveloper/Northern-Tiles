<?php

namespace App\Domain\Catalog\Http\Controllers\Admin;

use App\Domain\Catalog\Models\VisualizerRoom;
use App\Domain\Catalog\Models\VisualizerRoomImage;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class VisualizerController extends Controller
{
    public function index(Request $request): Response
    {
        $query = VisualizerRoom::query()
            ->withCount('products')
            ->withCount('images')
            ->ordered();

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->input('status') === 'active') {
            $query->where('is_active', true);
        } elseif ($request->input('status') === 'inactive') {
            $query->where('is_active', false);
        }

        $rooms = $query->paginate(20)->withQueryString();

        // Transform to include image_url
        $rooms->getCollection()->transform(function ($room) {
            $room->image_url = $room->image_url;
            return $room;
        });

        return Inertia::render('Admin/Visualizer/Index', [
            'rooms' => $rooms,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Visualizer/Create', [
            'defaultFloorBounds' => VisualizerRoom::getDefaultFloorBounds(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:visualizer_rooms,slug',
            'images' => 'required|array|min:1',
            'images.*' => 'image|max:10240', // 10MB max each
            'floor_bounds' => 'nullable|array',
            'floor_bounds.x' => 'nullable|numeric|min:0|max:100',
            'floor_bounds.y' => 'nullable|numeric|min:0|max:100',
            'floor_bounds.width' => 'nullable|numeric|min:0|max:100',
            'floor_bounds.height' => 'nullable|numeric|min:0|max:100',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        // Set defaults
        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);
        $validated['floor_bounds'] = $validated['floor_bounds'] ?? VisualizerRoom::getDefaultFloorBounds();
        $validated['sort_order'] = $validated['sort_order'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        // Handle first image as primary (on the room itself)
        $images = $request->file('images', []);
        if (!empty($images)) {
            $firstImage = array_shift($images);
            $validated['image_path'] = $firstImage->store('visualizer', 'public');
        }

        unset($validated['images']);

        $room = VisualizerRoom::create($validated);

        // Handle additional images
        foreach ($images as $index => $imageFile) {
            $path = $imageFile->store('visualizer', 'public');
            VisualizerRoomImage::create([
                'visualizer_room_id' => $room->id,
                'image_path' => $path,
                'floor_bounds' => $validated['floor_bounds'],
                'sort_order' => $index + 1,
            ]);
        }

        return redirect()->route('admin.visualizer.index')
            ->with('success', 'Room scene created successfully.');
    }

    public function edit(VisualizerRoom $visualizer): Response
    {
        $visualizer->load(['products:id,name,slug,image_url,price', 'images']);
        $visualizer->image_url = $visualizer->image_url;
        $visualizer->all_images = $visualizer->all_images;

        return Inertia::render('Admin/Visualizer/Edit', [
            'room' => $visualizer,
            'defaultFloorBounds' => VisualizerRoom::getDefaultFloorBounds(),
        ]);
    }

    public function update(Request $request, VisualizerRoom $visualizer): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:visualizer_rooms,slug,' . $visualizer->id,
            'new_images' => 'nullable|array',
            'new_images.*' => 'image|max:10240',
            'floor_bounds' => 'nullable|array',
            'floor_bounds.x' => 'nullable|numeric|min:0|max:100',
            'floor_bounds.y' => 'nullable|numeric|min:0|max:100',
            'floor_bounds.width' => 'nullable|numeric|min:0|max:100',
            'floor_bounds.height' => 'nullable|numeric|min:0|max:100',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        unset($validated['new_images']);

        $visualizer->update($validated);

        // Handle new images
        $newImages = $request->file('new_images', []);
        if (!empty($newImages)) {
            $maxSort = $visualizer->images()->max('sort_order') ?? 0;
            foreach ($newImages as $index => $imageFile) {
                $path = $imageFile->store('visualizer', 'public');
                VisualizerRoomImage::create([
                    'visualizer_room_id' => $visualizer->id,
                    'image_path' => $path,
                    'floor_bounds' => $visualizer->floor_bounds,
                    'sort_order' => $maxSort + $index + 1,
                ]);
            }
        }

        return redirect()->route('admin.visualizer.index')
            ->with('success', 'Room scene updated successfully.');
    }

    public function destroy(VisualizerRoom $visualizer): RedirectResponse
    {
        // Delete primary image
        if ($visualizer->image_path && !Str::startsWith($visualizer->image_path, ['http', '/'])) {
            Storage::disk('public')->delete($visualizer->image_path);
        }

        // Delete additional images (cascade will handle DB records)
        foreach ($visualizer->images as $image) {
            if ($image->image_path && !Str::startsWith($image->image_path, ['http', '/'])) {
                Storage::disk('public')->delete($image->image_path);
            }
        }

        $visualizer->delete();

        return redirect()->route('admin.visualizer.index')
            ->with('success', 'Room scene deleted successfully.');
    }

    public function toggleStatus(VisualizerRoom $visualizer): RedirectResponse
    {
        $visualizer->update(['is_active' => !$visualizer->is_active]);

        $status = $visualizer->is_active ? 'enabled' : 'disabled';
        return back()->with('success', "Room scene {$status} successfully.");
    }

    public function deleteImage(Request $request, VisualizerRoom $visualizer): RedirectResponse
    {
        $validated = $request->validate([
            'image_id' => 'required',
        ]);

        $imageId = $validated['image_id'];

        // Check if it's the primary image
        if ($imageId === 'primary') {
            // Can only delete primary if there are additional images
            $additionalImage = $visualizer->images()->orderBy('sort_order')->first();
            if (!$additionalImage) {
                return back()->with('error', 'Cannot delete the only image. Add another image first.');
            }

            // Delete old primary
            if ($visualizer->image_path && !Str::startsWith($visualizer->image_path, ['http', '/'])) {
                Storage::disk('public')->delete($visualizer->image_path);
            }

            // Promote first additional image to primary
            $visualizer->update(['image_path' => $additionalImage->image_path]);
            $additionalImage->delete();

            return back()->with('success', 'Primary image deleted. Next image promoted to primary.');
        }

        // Delete an additional image
        $image = $visualizer->images()->find($imageId);
        if ($image) {
            if ($image->image_path && !Str::startsWith($image->image_path, ['http', '/'])) {
                Storage::disk('public')->delete($image->image_path);
            }
            $image->delete();
            return back()->with('success', 'Image deleted successfully.');
        }

        return back()->with('error', 'Image not found.');
    }

    public function searchProducts(Request $request)
    {
        $search = $request->input('q', '');

        $products = Product::query()
            ->where('is_active', true)
            ->whereNotNull('image_url')
            ->where('image_url', '!=', '')
            ->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            })
            ->select(['id', 'name', 'slug', 'sku', 'image_url', 'price'])
            ->limit(20)
            ->get();

        return response()->json($products);
    }

    public function addProduct(Request $request, VisualizerRoom $visualizer): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $maxSort = $visualizer->products()->max('visualizer_room_products.sort_order') ?? 0;

        $visualizer->products()->syncWithoutDetaching([
            $validated['product_id'] => ['sort_order' => $maxSort + 1],
        ]);

        return back()->with('success', 'Product added to room.');
    }

    public function removeProduct(Request $request, VisualizerRoom $visualizer): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $visualizer->products()->detach($validated['product_id']);

        return back()->with('success', 'Product removed from room.');
    }

    public function reorderProducts(Request $request, VisualizerRoom $visualizer): RedirectResponse
    {
        $validated = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
        ]);

        foreach ($validated['product_ids'] as $index => $productId) {
            $visualizer->products()->updateExistingPivot($productId, ['sort_order' => $index]);
        }

        return back()->with('success', 'Products reordered.');
    }
}
