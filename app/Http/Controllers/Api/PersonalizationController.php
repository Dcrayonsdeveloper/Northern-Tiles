<?php

namespace App\Http\Controllers\Api;

use App\Domain\Personalization\Services\PersonalizationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonalizationController extends Controller
{
    public function __construct(
        protected PersonalizationService $personalizationService
    ) {}

    public function trackView(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $this->personalizationService->trackView(
            $validated['product_id'],
            $userId,
            $sessionId
        );

        return response()->json(['success' => true]);
    }

    public function recentlyViewed(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();
        $limit = min($request->input('limit', 10), 20);

        $products = $this->personalizationService->getRecentlyViewed($userId, $sessionId, $limit);

        return response()->json([
            'products' => $products,
        ]);
    }

    public function recommendations(Request $request, int $productId): JsonResponse
    {
        $limit = min($request->input('limit', 8), 20);

        $products = $this->personalizationService->getRecommendations($productId, $limit);

        return response()->json([
            'products' => $products,
        ]);
    }

    public function personalized(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();
        $limit = min($request->input('limit', 12), 24);

        $products = $this->personalizationService->getPersonalizedProducts($userId, $sessionId, $limit);

        return response()->json([
            'products' => $products,
        ]);
    }
}
