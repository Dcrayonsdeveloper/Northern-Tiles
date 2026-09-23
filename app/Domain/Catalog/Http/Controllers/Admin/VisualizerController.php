<?php

namespace App\Domain\Catalog\Http\Controllers\Admin;

use App\Domain\Catalog\Models\VisualizerRoom;
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
            'image' => 'required|image|max:10240', // 10MB max
            'floor_bounds' => 'nullable|array',
            'floor_bounds.x' => 'nullable|numeric|min:0|max:100',
            'floor_bounds.y' => 'nullable|numeric|min:0|max:100',
            'floor_bounds.width' => 'nullable|numeric|min:0|max:100',
            'floor_bounds.height' => 'nullable|numeric|min:0|max:100',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('visualizer', 'public');
            $validated['image_path'] = $path;
        }

        unset($validated['image']);

        // Set defaults
        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);
        $validated['floor_bounds'] = $validated['floor_bounds'] ?? VisualizerRoom::getDefaultFloorBounds();
        $validated['sort_order'] = $validated['sort_order'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        VisualizerRoom::create($validated);

        return redirect()->route('admin.visualizer.index')
            ->with('success', 'Room scene created successfully.');
    }

    public function edit(VisualizerRoom $visualizer): Response
    {
        $visualizer->load('products:id,name,slug,image_url,price');
        $visualizer->image_url = $visualizer->image_url;

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
            'image' => 'nullable|image|max:10240',
            'floor_bounds' => 'nullable|array',
            'floor_bounds.x' => 'nullable|numeric|min:0|max:100',
            'floor_bounds.y' => 'nullable|numeric|min:0|max:100',
            'floor_bounds.width' => 'nullable|numeric|min:0|max:100',
            'floor_bounds.height' => 'nullable|numeric|min:0|max:100',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image
            if ($visualizer->image_path && !Str::startsWith($visualizer->image_path, ['http', '/'])) {
                Storage::disk('public')->delete($visualizer->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('visualizer', 'public');
        }

        unset($validated['image']);

        $visualizer->update($validated);

        return redirect()->route('admin.visualizer.index')
            ->with('success', 'Room scene updated successfully.');
    }

    public function destroy(VisualizerRoom $visualizer): RedirectResponse
    {
        // Delete image
        if ($visualizer->image_path && !Str::startsWith($visualizer->image_path, ['http', '/'])) {
            Storage::disk('public')->delete($visualizer->image_path);
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
