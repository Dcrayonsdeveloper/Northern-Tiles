<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\InstagramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstagramController extends Controller
{
    public function __construct(private InstagramService $instagram) {}

    public function posts(): JsonResponse
    {
        $posts = $this->instagram->getPosts(12);
        return response()->json(['posts' => $posts]);
    }

    public function thumbnails(Request $request): JsonResponse
    {
        $urls = array_slice((array) $request->query('urls', []), 0, 12);
        $result = [];
        foreach ($urls as $url) {
            $result[$url] = $this->instagram->getThumbnail((string) $url);
        }
        return response()->json($result);
    }
}
