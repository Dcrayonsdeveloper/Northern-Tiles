<?php

/**
 * Pulls the hardcoded stock photography into local storage.
 *
 * The home page and mobile menu pointed straight at images.unsplash.com, so
 * the site's own look depended on a third party staying up and on every
 * visitor being able to reach it. Downloaded once, they are served from
 * /storage/stock/ like any other asset.
 *
 * Saved at full width with no crop: the JSX asks for portrait, landscape and
 * square versions of the same photograph, and object-cover in the browser does
 * a better job of that than storing three crops.
 */

use Illuminate\Support\Facades\Storage;

$ids = [
    'photo-1581858726788-75bc0f6a952d',
    'photo-1584622650111-993a426fbf0a',
    'photo-1600047509807-ba8f99d2cdde',
    'photo-1600210492486-724fe5c67fb0',
    'photo-1600566752355-35792bedcfea',
    'photo-1600566753190-17f0baa2a6c3',
    'photo-1600573472592-401b489a3cdc',
    'photo-1600585153490-76fb20a32601',
    'photo-1600585154340-be6161a56a0c',
    'photo-1600596542815-ffad4c1539a9',
    'photo-1600607687939-ce8a6c25118c',
    'photo-1615971677499-5467cbab01c0',
    'photo-1618220179428-22790b461013',
    // Used by the showroom section and the mega menu artwork.
    'photo-1552321554-5fefe8c9ef14',
    'photo-1556909212-d5b604d0c90d',
];

$disk = Storage::disk('public');
$disk->makeDirectory('stock');

$saved = 0;
$skipped = 0;
$failed = [];

foreach ($ids as $id) {
    $path = 'stock/' . $id . '.jpg';

    if ($disk->exists($path) && ! getenv('FORCE')) {
        $skipped++;
        continue;
    }

    $bytes = @file_get_contents('https://images.unsplash.com/' . $id . '?w=1920&q=80&fm=jpg');

    // A truncated file renders as a broken image, which is worse than the
    // remote one it replaces — so only a real payload is written.
    if ($bytes === false || strlen($bytes) < 10000) {
        $failed[] = $id;
        continue;
    }

    $disk->put($path, $bytes);
    $saved++;
}

echo "downloaded: {$saved}\n";
echo "already had: {$skipped}\n";
echo 'failed: ' . count($failed) . ($failed ? ' (' . implode(', ', $failed) . ')' : '') . "\n";
echo 'files in stock/: ' . count($disk->files('stock')) . "\n";
