<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$products = DB::table('products')
    ->select('id','name','slug','sku','description','short_description','specifications',
             'brand','category_id','price','inventory_quantity','stock','is_active',
             'status','image_url','lifestyle_image_url')
    ->orderBy('id')
    ->get();

$mediaCounts = DB::table('product_media')
    ->where('type','image')
    ->select('product_id', DB::raw('COUNT(*) as cnt'))
    ->groupBy('product_id')
    ->pluck('cnt','product_id');

$isMissing = fn($v) => $v === null
    || trim((string)$v) === ''
    || in_array(strtolower(trim((string)$v)), ['n/a','none','null','test','-','na','placeholder','n.a.'], true);

$wordCount = fn($v) => $v ? str_word_count(strip_tags((string)$v)) : 0;

$specCount = function($v) {
    if (!$v) return 0;
    $arr = json_decode((string)$v, true);
    if (!is_array($arr)) return 0;
    return count(array_filter($arr, fn($val) => !empty($val) && $val !== '0' && $val !== 0));
};

$genericTitle = fn($v) => (bool) preg_match('/^(product|item|test|untitled|tile|tiles|new\s+product)\s*$/i', trim((string)$v));

$rows   = [];
$totals = [
    'title_missing' => 0, 'title_partial' => 0,
    'desc_missing'  => 0, 'desc_partial'  => 0,
    'spec_missing'  => 0, 'spec_partial'  => 0,
    'img_missing'   => 0, 'img_partial'   => 0, 'img_complete' => 0,
    'price_missing' => 0, 'sku_missing'   => 0,
    'cat_missing'   => 0, 'brand_missing' => 0, 'stock_missing' => 0,
    'multi2plus'    => 0, 'multi3plus'    => 0, 'multi5plus'    => 0,
    'excellent'     => 0, 'good'          => 0, 'fair'          => 0,
    'poor'          => 0, 'critical'      => 0, 'fully_complete'=> 0,
];

foreach ($products as $p) {
    $missing = [];

    // TITLE
    if ($isMissing($p->name)) {
        $titleSt = 'MISSING'; $totals['title_missing']++; $missing[] = 'Title';
    } elseif ($genericTitle($p->name) || str_word_count((string)$p->name) < 3) {
        $titleSt = 'PARTIAL'; $totals['title_partial']++;
    } else {
        $titleSt = 'OK';
    }

    // DESCRIPTION
    $wc = $wordCount($p->description);
    if ($isMissing($p->description)) {
        $descSt = 'MISSING'; $totals['desc_missing']++; $missing[] = 'Description';
    } elseif ($wc < 30) {
        $descSt = 'PARTIAL'; $totals['desc_partial']++;
    } else {
        $descSt = 'OK';
    }

    // SPECIFICATIONS
    $sc = $specCount($p->specifications);
    if ($isMissing($p->specifications) || $sc === 0) {
        $specSt = 'MISSING'; $totals['spec_missing']++; $missing[] = 'Specs';
    } elseif ($sc < 3) {
        $specSt = 'PARTIAL'; $totals['spec_partial']++;
    } else {
        $specSt = 'OK';
    }

    // IMAGE
    $hasMain    = !empty(trim($p->image_url ?? ''));
    $mediaCount = (int)($mediaCounts[$p->id] ?? 0);
    $totalImgs  = ($hasMain ? 1 : 0) + $mediaCount;
    if ($totalImgs === 0) {
        $imgSt = 'MISSING'; $totals['img_missing']++; $missing[] = 'Image';
    } elseif ($totalImgs === 1) {
        $imgSt = 'PARTIAL'; $totals['img_partial']++;
    } else {
        $imgSt = 'OK'; $totals['img_complete']++;
    }

    // PRICE
    if ($p->price === null || (float)$p->price <= 0) {
        $priceSt = 'MISSING'; $totals['price_missing']++; $missing[] = 'Price';
    } else {
        $priceSt = 'OK';
    }

    // SKU
    if ($isMissing($p->sku)) {
        $skuSt = 'MISSING'; $totals['sku_missing']++; $missing[] = 'SKU';
    } else {
        $skuSt = 'OK';
    }

    // CATEGORY
    if (empty($p->category_id)) {
        $catSt = 'MISSING'; $totals['cat_missing']++; $missing[] = 'Category';
    } else {
        $catSt = 'OK';
    }

    // BRAND
    if ($isMissing($p->brand)) {
        $brandSt = 'MISSING'; $totals['brand_missing']++; $missing[] = 'Brand';
    } else {
        $brandSt = 'OK';
    }

    // STOCK
    $inv = (int)($p->inventory_quantity ?? 0);
    if ($inv <= 0) {
        $stockSt = 'MISSING'; $totals['stock_missing']++; $missing[] = 'Stock';
    } else {
        $stockSt = 'OK';
    }

    $mc = count($missing);
    if ($mc >= 2) $totals['multi2plus']++;
    if ($mc >= 3) $totals['multi3plus']++;
    if ($mc >= 5) $totals['multi5plus']++;

    if ($mc === 0)      { $sev = 'EXCELLENT'; $totals['excellent']++; $totals['fully_complete']++; }
    elseif ($mc === 1)  { $sev = 'GOOD';      $totals['good']++; }
    elseif ($mc <= 3)   { $sev = 'FAIR';      $totals['fair']++; }
    elseif ($mc <= 5)   { $sev = 'POOR';      $totals['poor']++; }
    else                { $sev = 'CRITICAL';  $totals['critical']++; }

    $rows[] = compact('p','titleSt','descSt','specSt','imgSt','priceSt',
                      'skuSt','catSt','brandSt','stockSt','sev','mc','missing');
}

$total      = count($products);
$incomplete = $total - $totals['fully_complete'];

$sep = str_repeat('=', 80);
$line = str_repeat('-', 80);

echo "\n$sep\n";
echo "         NORTHERN TILES — PRODUCT CATALOG COMPLETENESS AUDIT\n";
echo "$sep\n\n";

// ── 1. SUMMARY ──────────────────────────────────────────────────────────────
echo "══════════════════════  1. SUMMARY  ══════════════════════\n\n";
printf("  Total Products:           %d\n",   $total);
printf("  Fully Complete Products:  %d\n",   $totals['fully_complete']);
printf("  Incomplete Products:      %d\n",   $incomplete);
printf("  Complete Percentage:      %.1f%%\n", $totals['fully_complete']/$total*100);
printf("  Incomplete Percentage:    %.1f%%\n", $incomplete/$total*100);

echo "\n  ── FIELD-WISE MISSING COUNTS ──\n";
$fields = [
    'Title'       => $totals['title_missing'],
    'Description' => $totals['desc_missing'],
    'Specs'       => $totals['spec_missing'],
    'Image'       => $totals['img_missing'],
    'Price'       => $totals['price_missing'],
    'SKU'         => $totals['sku_missing'],
    'Category'    => $totals['cat_missing'],
    'Brand'       => $totals['brand_missing'],
    'Stock'       => $totals['stock_missing'],
];
foreach ($fields as $f => $c) {
    printf("  %-28s %4d  (%5.1f%%)\n", "Products Missing $f:", $c, $c/$total*100);
}

echo "\n  ── PARTIAL DATA COUNTS ──\n";
printf("  %-28s %4d\n", 'Partial Titles:',       $totals['title_partial']);
printf("  %-28s %4d\n", 'Partial Descriptions:',  $totals['desc_partial']);
printf("  %-28s %4d\n", 'Partial Specs:',         $totals['spec_partial']);
printf("  %-28s %4d\n", 'Partial Images:',        $totals['img_partial']);

echo "\n  ── MULTI-ISSUE PRODUCTS ──\n";
printf("  %-28s %4d\n", 'Missing 2+ Fields:', $totals['multi2plus']);
printf("  %-28s %4d\n", 'Missing 3+ Fields:', $totals['multi3plus']);
printf("  %-28s %4d\n", 'Missing 5+ Fields:', $totals['multi5plus']);

// ── 2. DETAILED TABLE ────────────────────────────────────────────────────────
echo "\n$sep\n";
echo "════════════════  2. DETAILED PRODUCT REPORT  ════════════════\n";
echo "$sep\n";
printf("%-5s %-38s %-10s %-7s %-7s %-7s %-7s %-7s %-7s %-7s %-7s %-7s %2s  %-s\n",
    'ID','Product Name','SKU',
    'Title','Desc','Spec','Image','Price','SKU','Cat','Brand','Stock','N','Missing Fields');
echo str_repeat('-', 170) . "\n";

foreach ($rows as $r) {
    $p = $r['p'];
    printf("%-5d %-38s %-10s %-7s %-7s %-7s %-7s %-7s %-7s %-7s %-7s %-7s %2d  %-s\n",
        $p->id,
        mb_substr($p->name ?? 'N/A', 0, 38),
        mb_substr($p->sku  ?? 'N/A', 0, 10),
        $r['titleSt'], $r['descSt'], $r['specSt'], $r['imgSt'],
        $r['priceSt'], $r['skuSt'],  $r['catSt'],  $r['brandSt'], $r['stockSt'],
        $r['mc'],
        implode(', ', $r['missing'])
    );
}

// ── 3. FINAL ANALYSIS ────────────────────────────────────────────────────────
arsort($fields);
$topMissing = array_key_first($fields);
$partials = [
    'Titles'       => $totals['title_partial'],
    'Descriptions' => $totals['desc_partial'],
    'Specs'        => $totals['spec_partial'],
    'Images'       => $totals['img_partial'],
];
arsort($partials);
$topPartial = array_key_first($partials);

// Quality score: 9 fields, each missing = 1 deduction
$maxScore   = $total * 9;
$deductions = array_sum(array_values($fields));
$qScore     = round(($maxScore - $deductions) / $maxScore * 100, 1);

echo "\n$sep\n";
echo "═══════════════════  3. FINAL ANALYSIS  ═══════════════════\n";
echo "$sep\n\n";
printf("  Fully complete:                %.1f%%\n",  $totals['fully_complete']/$total*100);
printf("  Missing images:                %.1f%%\n",  $totals['img_missing']/$total*100);
printf("  Missing specifications:        %.1f%%\n",  $totals['spec_missing']/$total*100);
printf("  Most commonly MISSING field:   %s (%d products)\n", $topMissing, $fields[$topMissing]);
printf("  Most commonly PARTIAL field:   %s (%d products)\n", $topPartial, $partials[$topPartial]);
printf("\n  Quality Score:                 %.1f / 100\n", $qScore);

echo "\n  ── TOP 10 WORST PRODUCTS ──\n";
$sorted = $rows;
usort($sorted, fn($a, $b) => $b['mc'] - $a['mc']);
$top10 = array_slice($sorted, 0, 10);
printf("  %-5s %-38s %-10s %3s  %-s\n", 'ID', 'Name', 'SKU', 'N', 'Missing Fields');
echo '  ' . str_repeat('-', 100) . "\n";
foreach ($top10 as $r) {
    $p = $r['p'];
    printf("  %-5d %-38s %-10s %3d  %-s\n",
        $p->id, mb_substr($p->name ?? 'N/A', 0, 38),
        mb_substr($p->sku ?? 'N/A', 0, 10),
        $r['mc'], implode(', ', $r['missing']));
}

echo "\n  ── RECOMMENDATIONS ──\n";
$recs = [
    'Brand'       => 'Add brand/vendor name to all products — critical for filtering & SEO.',
    'Stock'       => 'Set inventory_quantity for all products to enable stock-aware features.',
    'Image'       => 'Upload product images — zero images severely hurts conversions.',
    'Description' => 'Write or import full product descriptions (min 30 words).',
    'Specs'       => 'Add structured specifications (material, size, finish, etc.).',
    'Price'       => 'Set correct pricing — products with $0 price cannot be sold.',
    'Title'       => 'Ensure every product has a descriptive title (3+ words).',
    'SKU'         => 'Assign unique SKUs to all products for inventory tracking.',
    'Category'    => 'Assign every product to a category for browsing & SEO.',
];
$rank = 1;
foreach ($fields as $f => $c) {
    if ($c > 0 && isset($recs[$f])) {
        printf("  %d. [%d products] %s\n", $rank++, $c, $recs[$f]);
    }
}

// ── 4. SEVERITY ──────────────────────────────────────────────────────────────
echo "\n$sep\n";
echo "═══════════════  4. SEVERITY CLASSIFICATION  ═══════════════\n";
echo "$sep\n\n";
$sevMap = [
    'EXCELLENT' => ['count' => $totals['excellent'], 'label' => '0 missing fields'],
    'GOOD'      => ['count' => $totals['good'],      'label' => '1 missing field'],
    'FAIR'      => ['count' => $totals['fair'],      'label' => '2-3 missing fields'],
    'POOR'      => ['count' => $totals['poor'],      'label' => '4-5 missing fields'],
    'CRITICAL'  => ['count' => $totals['critical'],  'label' => '6+ missing fields'],
];
foreach ($sevMap as $sev => $data) {
    $bar = str_repeat('█', (int)($data['count'] / $total * 40));
    printf("  %-10s %4d (%5.1f%%)  %-40s  [%s]\n",
        $sev.':', $data['count'], $data['count']/$total*100, $data['label'], $bar);
}

// ── 5. STRICT CHECK ──────────────────────────────────────────────────────────
echo "\n$sep\n";
echo "═══════════════════  5. FINAL STRICT CHECK  ═════════════════\n";
echo "$sep\n\n";
$sevTotal = $totals['excellent']+$totals['good']+$totals['fair']+$totals['poor']+$totals['critical'];
$checks = [
    "Total products = 392"                       => $total === 392,
    "Complete + Incomplete = Total"              => ($totals['fully_complete'] + $incomplete) === $total,
    "Severity totals = Total"                    => $sevTotal === $total,
    "Detail rows = Total"                        => count($rows) === $total,
    "No products skipped"                        => count($rows) === $total,
    "brand_missing <= total"                     => $totals['brand_missing'] <= $total,
    "stock_missing <= total"                     => $totals['stock_missing'] <= $total,
];
foreach ($checks as $label => $pass) {
    printf("  %-45s  %s\n", $label, $pass ? '✓ PASS' : '✗ FAIL');
}
echo "\n$sep\n";
echo "  Report complete. All $total products audited.\n";
echo "$sep\n\n";
