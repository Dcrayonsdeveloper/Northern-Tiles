<?php

namespace App\Http\Controllers\Api;

use App\Domain\Catalog\Services\FavoriteService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function __construct(
        protected FavoriteService $favoriteService
    ) {}

    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $result = $this->favoriteService->toggle($user->id, $validated['product_id']);

        return response()->json([
            'success' => true,
            'is_favorite' => $result['is_favorite'],
            'action' => $result['action'],
            'count' => $this->favoriteService->getCount($user->id),
        ]);
    }

    public function count(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['count' => 0]);
        }

        return response()->json([
            'count' => $this->favoriteService->getCount($user->id),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $favorites = $this->favoriteService->getFavorites($user->id, $request->input('per_page', 15));

        return response()->json($favorites);
    }

    public function check(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json(['is_favorite' => false]);
        }

        return response()->json([
            'is_favorite' => $this->favoriteService->isFavorite($user->id, $validated['product_id']),
        ]);
    }
}
