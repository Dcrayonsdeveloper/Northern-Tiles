<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class InstagramService
{
    private const CACHE_KEY = 'instagram.posts';
    private const CACHE_TTL = 3600; // 1 hour

    public function getPosts(int $limit = 12): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, fn () => $this->fetchFromApi($limit));
    }

    /**
     * Returns a local public URL for the reel thumbnail.
     * Downloads and stores the image on first call; subsequent calls return the cached file.
     */
    public function getThumbnail(string $reelUrl): ?string
    {
        $slug = md5($reelUrl);
        $storagePath = "instagram/{$slug}.jpg";
        $disk = Storage::disk('public');

        if ($disk->exists($storagePath)) {
            return '/storage/' . $storagePath;
        }

        $cdnUrl = $this->scrapeOgImage($reelUrl);
        if (!$cdnUrl) return null;

        try {
            $imageResp = Http::timeout(15)
                ->withHeaders([
                    'Referer'    => 'https://www.instagram.com/',
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept'     => 'image/webp,image/apng,image/*,*/*;q=0.8',
                ])
                ->get($cdnUrl);

            if (!$imageResp->successful()) return null;

            $disk->put($storagePath, $imageResp->body());
            return '/storage/' . $storagePath;
        } catch (\Throwable $e) {
            Log::warning('Instagram image download failed: ' . $e->getMessage());
            return null;
        }
    }

    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    private function scrapeOgImage(string $reelUrl): ?string
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'])
                ->get($reelUrl);

            if (!$response->successful()) return null;

            $html = $response->body();

            if (preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\'](https?:[^"\']+)["\']/', $html, $m)) {
                return html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5);
            }
            if (preg_match('/<meta[^>]+content=["\'](https?:[^"\']+)["\'][^>]+property=["\']og:image["\']/', $html, $m)) {
                return html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5);
            }
            return null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function fetchFromApi(int $limit): array
    {
        $token = config('services.instagram.access_token');

        if (!$token) {
            return [];
        }

        try {
            $response = Http::timeout(8)->get('https://graph.instagram.com/me/media', [
                'fields'       => 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
                'limit'        => $limit,
                'access_token' => $token,
            ]);

            if (!$response->successful()) {
                Log::warning('Instagram API error', ['status' => $response->status(), 'body' => $response->body()]);
                return [];
            }

            $data = $response->json('data', []);

            return collect($data)
                ->filter(fn ($p) => in_array($p['media_type'] ?? '', ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']))
                ->map(fn ($p) => [
                    'id'         => $p['id'],
                    'caption'    => $this->truncateCaption($p['caption'] ?? ''),
                    'media_type' => $p['media_type'],
                    'image_url'  => $p['thumbnail_url'] ?? $p['media_url'] ?? '',
                    'permalink'  => $p['permalink'],
                    'is_video'   => $p['media_type'] === 'VIDEO',
                    'timestamp'  => $p['timestamp'],
                ])
                ->values()
                ->all();
        } catch (\Throwable $e) {
            Log::error('Instagram fetch failed: ' . $e->getMessage());
            return [];
        }
    }

    private function truncateCaption(string $caption): string
    {
        $caption = preg_replace('/#\S+/', '', $caption);
        $caption = trim($caption);
        return mb_strlen($caption) > 80 ? mb_substr($caption, 0, 77) . '…' : $caption;
    }
}
