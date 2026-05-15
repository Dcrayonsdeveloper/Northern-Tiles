<?php
/**
 * Sync product image_url from the Shopify CSV export.
 * Maps CSV Handle -> Image Src to DB products by slug (with fuzzy matching).
 *
 * Run: php artisan tinker --execute="require base_path('scripts/sync_images.php');"
 */

$csvPath = public_path('products_export_1 (4).csv');

// ── 1. Parse CSV: handle → first image URL ───────────────────────────────────
$csvImages = [];
if (($h = fopen($csvPath, 'r')) !== false) {
    $headers = fgetcsv($h);
    $handleIdx = array_search('Handle', $headers);
    $imageIdx  = array_search('Image Src', $headers);

    while (($row = fgetcsv($h)) !== false) {
        $handle = trim($row[$handleIdx] ?? '');
        $image  = trim($row[$imageIdx]  ?? '');
        if ($handle && $image && !isset($csvImages[$handle])) {
            $csvImages[$handle] = $image;
        }
    }
    fclose($h);
}

echo "CSV images loaded: " . count($csvImages) . PHP_EOL;

// ── 2. Normalise helper ───────────────────────────────────────────────────────
$normalise = function (string $s): string {
    return preg_replace('/[-_]+/', '-', strtolower(trim($s)));
};

// Strip all known trailing ID suffixes from CSV handles, e.g.:
//   coco-black-hat-matt-50x150mm-27982         → coco-black-hat-matt-50x150mm
//   argile-dark-matt-square-100x100mm-v2-27574 → argile-dark-matt-square-100x100mm
//   colors-subway-acquamarine-gloss-48x450mm-j92073 → colors-subway-acquamarine-gloss-48x450mm
$stripSuffix = function (string $handle): string {
    // Remove -v2-NNNNN, -NNNNN, or -jNNNNN (letter prefix + digits) at end
    return preg_replace('/(-v\d+)?-[a-z]{0,3}\d{4,}$/', '', $handle);
};

// Build normalised CSV map for fuzzy look-up
$normCsvMap = [];
foreach ($csvImages as $handle => $url) {
    $normHandle  = $normalise($handle);
    $stripped    = $normalise($stripSuffix($handle));
    // Remove ALL -subway- occurrences (can be anywhere in handle)
    $noSubway    = str_replace('-subway-', '-', $stripped);
    // Also strip trailing -subway if at very end
    $noSubwayEnd = rtrim($noSubway, '-');
    // With and without trailing mm on size
    $withMm  = preg_replace('/-(\d+x\d+)(-|$)/', '-$1mm$2', $stripped);
    $withoutMm = preg_replace('/-(\d+x\d+)mm/', '-$1', $stripped);

    $candidates = [$normHandle, $stripped, $noSubway, $noSubwayEnd, $withMm, $withoutMm,
                   str_replace('-subway-', '-', $withMm), str_replace('-subway-', '-', $withoutMm)];

    foreach ($candidates as $key) {
        if ($key && !isset($normCsvMap[$key])) {
            $normCsvMap[$key] = $url;
        }
    }
    // Also without trailing size suffix (e.g. -50x400mm)
    $noSize = preg_replace('/-\d+x\d+(mm)?$/', '', $noSubway);
    if (strlen($noSize) > 4 && !isset($normCsvMap[$noSize])) {
        $normCsvMap[$noSize] = $url;
    }
}

// ── 3. Match & update products ───────────────────────────────────────────────
$products = App\Models\Product::all(['id', 'slug', 'name', 'image_url']);

$updated   = 0;
$skipped   = 0;
$notFound  = [];

foreach ($products as $product) {
    $slug     = $product->slug;
    $normSlug = $normalise($slug);
    $noSize   = preg_replace('/-\d+x\d+mm$/', '', $normSlug);

    $newUrl = null;

    // Also strip version suffix from DB slug (e.g. sabbia-milk-matt-65x200-v2-31882)
    $strippedSlug = $normalise(preg_replace('/(-v\d+)?-[a-z]{0,3}\d{4,}$/', '', $slug));
    // With/without mm on size
    $slugWithMm    = preg_replace('/-(\d+x\d+)(-|$)/', '-$1mm$2', $normSlug);
    $slugWithoutMm = preg_replace('/-(\d+x\d+)mm/', '-$1', $normSlug);
    // Remove "plain-" from DB slug (urban-plain-white → urban-white)
    $noPlain = str_replace('-plain-', '-', $normSlug);
    // Strip individual color words from la-riviera style slugs:
    //   la-riviera-blanc-gloss-65x200 → la-riviera-gloss-65x200
    $noColor = preg_replace('/^(la-riviera|tribeca|splendours|massimo)-[a-z-]+-?(gloss|matt|satin)-/', '$1-$2-', $strippedSlug);
    $noColorSize = preg_replace('/-\d+x\d+(mm)?$/', '', $noColor);

    $slugCandidates = array_filter(array_unique([
        $normSlug, $strippedSlug, $slugWithMm, $slugWithoutMm,
        $noSize, $noPlain, $noColor, $noColorSize
    ]));

    // Exact slug match
    if (isset($csvImages[$slug])) {
        $newUrl = $csvImages[$slug];
    }
    else {
        foreach ($slugCandidates as $candidate) {
            if (isset($normCsvMap[$candidate])) {
                $newUrl = $normCsvMap[$candidate];
                break;
            }
        }
    }

    // ── Fallback: word-overlap scoring against all CSV handles ──────────────
    if (!$newUrl) {
        $dbWords   = array_filter(explode('-', $strippedSlug), fn($w) => strlen($w) > 2 && !in_array($w, ['the','and','for','gloss','matt','satin','porcelain','subway','plain']));
        $sizeMatch = null;
        if (preg_match('/\d+x\d+/', $strippedSlug, $sm)) {
            $sizeMatch = $sm[0];
        }
        $bestScore  = 0;
        $bestUrl    = null;

        foreach ($csvImages as $csvHandle => $csvUrl) {
            $normCsv  = $normalise($stripSuffix($csvHandle));
            $normCsv  = str_replace('-subway-', '-', $normCsv);
            $csvWords = array_filter(explode('-', $normCsv), fn($w) => strlen($w) > 2);

            $overlap = count(array_intersect($dbWords, $csvWords));
            if ($overlap < 2) continue; // Need at least 2 word overlap

            // Bonus for matching size
            $hasSizeMatch = $sizeMatch && str_contains($normCsv, $sizeMatch);
            $score = $overlap + ($hasSizeMatch ? 3 : 0);

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestUrl   = $csvUrl;
            }
        }

        if ($bestUrl) {
            $newUrl = $bestUrl;
        }
    }

    if ($newUrl) {
        $product->image_url = $newUrl;
        $product->save();
        echo "  ✓ " . $slug . PHP_EOL;
        $updated++;
    } else {
        $notFound[] = $slug;
        $skipped++;
    }
}

echo PHP_EOL . "── Summary ──" . PHP_EOL;
echo "Updated : {$updated}" . PHP_EOL;
echo "No match: {$skipped}" . PHP_EOL;

if ($notFound) {
    echo PHP_EOL . "Not matched:" . PHP_EOL;
    foreach ($notFound as $s) {
        echo "  ✗ {$s}" . PHP_EOL;
    }
}
