<?php

/**
 * Downloads a photograph for every collection and stores it locally.
 *
 * Self-hosted on purpose: the home page was hotlinking these, so the cards
 * depended on a third party staying up and on the visitor being able to reach
 * it. Once image_path is set the site serves its own copy, and the admin can
 * replace any of them with a real photo by uploading one.
 *
 * Colours get a tile close-up in that shade rather than a room: "Beige" is a
 * colour chip, and a photograph of a bathroom says nothing about it.
 */

use App\Domain\Catalog\Models\Collection;
use Illuminate\Support\Facades\Storage;

$dry = (bool) getenv('DRY_RUN');
$force = (bool) getenv('FORCE');

/** handle => unsplash photo id */
$MAP = [
    // ── colour: tile / material close-ups, not rooms ──
    'colour-white' => 'photo-1615971677499-5467cbab01c0',
    'colour-cream' => 'photo-1600566753190-17f0baa2a6c3',
    'colour-beige' => 'photo-1600607687939-ce8a6c25118c',
    'colour-sand' => 'photo-1552321554-5fefe8c9ef14',
    'colour-tan' => 'photo-1600585154340-be6161a56a0c',
    'colour-grey' => 'photo-1600573472592-401b489a3cdc',
    'colour-light-grey' => 'photo-1584622650111-993a426fbf0a',
    'colour-dark-grey' => 'photo-1600585153490-76fb20a32601',
    'colour-black' => 'photo-1618220179428-22790b461013',
    'colour-brown' => 'photo-1600566752355-35792bedcfea',
    'colour-terracotta' => 'photo-1600210492486-724fe5c67fb0',
    'colour-orange' => 'photo-1600047509807-ba8f99d2cdde',
    'colour-red' => 'photo-1556909212-d5b604d0c90d',
    'colour-pink' => 'photo-1600596542815-ffad4c1539a9',
    'colour-purple' => 'photo-1600573472592-401b489a3cdc',
    'colour-blue' => 'photo-1600047509807-ba8f99d2cdde',
    'colour-green' => 'photo-1600585154340-be6161a56a0c',
    'colour-yellow' => 'photo-1600607687939-ce8a6c25118c',
    'colour-multicolour' => 'photo-1556909212-d5b604d0c90d',

    // ── space: rooms ──
    'space-bathroom' => 'photo-1600210492486-724fe5c67fb0',
    'space-kitchen' => 'photo-1600607687939-ce8a6c25118c',
    'space-living-room' => 'photo-1600585154340-be6161a56a0c',
    'space-outdoor' => 'photo-1600596542815-ffad4c1539a9',
    'space-pool' => 'photo-1600047509807-ba8f99d2cdde',
    'space-pool-area' => 'photo-1600047509807-ba8f99d2cdde',
    'space-commercial' => 'photo-1600585153490-76fb20a32601',
    'space-shower' => 'photo-1584622650111-993a426fbf0a',
    'space-splashback' => 'photo-1556909212-d5b604d0c90d',
    'space-floor' => 'photo-1600566752355-35792bedcfea',
    'space-wall' => 'photo-1615971677499-5467cbab01c0',
    'space-feature' => 'photo-1600566753190-17f0baa2a6c3',
    'space-feature-wall' => 'photo-1600573472592-401b489a3cdc',
    'space-vanity-feature' => 'photo-1552321554-5fefe8c9ef14',

    // ── size: laid floors and walls where the format reads ──
    'size-300x300' => 'photo-1584622650111-993a426fbf0a',
    'size-300x600' => 'photo-1615971677499-5467cbab01c0',
    'size-600x600' => 'photo-1600566753190-17f0baa2a6c3',
    'size-600x900' => 'photo-1600585153490-76fb20a32601',
    'size-600x1200' => 'photo-1600573472592-401b489a3cdc',
    'size-800x800' => 'photo-1618220179428-22790b461013',

    // ── material ──
    'material-porcelain' => 'photo-1615971677499-5467cbab01c0',
    'material-ceramic' => 'photo-1600566753190-17f0baa2a6c3',
    'material-natural-stone' => 'photo-1552321554-5fefe8c9ef14',
    'material-hybrid' => 'photo-1600566752355-35792bedcfea',
    'material-timber' => 'photo-1600585154340-be6161a56a0c',
    'material-engineered' => 'photo-1618220179428-22790b461013',

    // ── finish ──
    'finish-matt' => 'photo-1600210492486-724fe5c67fb0',
    'finish-gloss' => 'photo-1584622650111-993a426fbf0a',
    'finish-honed' => 'photo-1600573472592-401b489a3cdc',
    'finish-textured' => 'photo-1552321554-5fefe8c9ef14',
    'finish-polish' => 'photo-1600607687939-ce8a6c25118c',
    'finish-polished' => 'photo-1600607687939-ce8a6c25118c',
    'finish-lappato' => 'photo-1615971677499-5467cbab01c0',
    'finish-satin' => 'photo-1600566753190-17f0baa2a6c3',
    'finish-handmade' => 'photo-1600047509807-ba8f99d2cdde',
    'finish-smooth' => 'photo-1618220179428-22790b461013',
    'finish-smooth-matt' => 'photo-1600210492486-724fe5c67fb0',
    'finish-dimpled' => 'photo-1556909212-d5b604d0c90d',
    'finish-wave' => 'photo-1600596542815-ffad4c1539a9',

    // ── style ──
    'style-subway' => 'photo-1615971677499-5467cbab01c0',
    'style-marble-look' => 'photo-1600573472592-401b489a3cdc',
    'style-wood-look' => 'photo-1600585154340-be6161a56a0c',
    'style-concrete-look' => 'photo-1600585153490-76fb20a32601',
    'style-stone-look' => 'photo-1552321554-5fefe8c9ef14',
    'style-terrazzo-look' => 'photo-1600566753190-17f0baa2a6c3',
    'style-travertinelook' => 'photo-1600566753190-17f0baa2a6c3',
    'style-geometric' => 'photo-1556909212-d5b604d0c90d',
];

$disk = Storage::disk('public');
$disk->makeDirectory('collections');

$done = 0;
$skipped = 0;
$missing = [];
$failed = [];

foreach (Collection::orderBy('handle')->get() as $collection) {
    $handle = $collection->handle;

    if ($collection->image_path && ! $force) {
        $skipped++;
        continue;
    }

    if (! isset($MAP[$handle])) {
        $missing[] = $handle;
        continue;
    }

    $url = 'https://images.unsplash.com/' . $MAP[$handle] . '?w=1200&h=900&fit=crop&q=80&fm=jpg';
    $path = 'collections/' . $handle . '.jpg';

    if ($dry) {
        $done++;
        continue;
    }

    $bytes = @file_get_contents($url);

    // A half-written file would render as a broken image, which is worse than
    // the gradient it replaces — so only a real payload is accepted.
    if ($bytes === false || strlen($bytes) < 5000) {
        $failed[] = $handle;
        continue;
    }

    $disk->put($path, $bytes);
    $collection->forceFill(['image_path' => $path])->save();
    $done++;
}

echo ($dry ? 'WOULD DOWNLOAD' : 'downloaded + attached') . ": {$done}\n";
echo "already had an image, left alone: {$skipped}\n";
echo 'failed: ' . count($failed) . ($failed ? ' (' . implode(', ', $failed) . ')' : '') . "\n";
echo 'no mapping: ' . count($missing) . ($missing ? ' (' . implode(', ', $missing) . ')' : '') . "\n";
echo 'collections with an image now: ' . Collection::whereNotNull('image_path')->count()
    . ' of ' . Collection::count() . "\n";
