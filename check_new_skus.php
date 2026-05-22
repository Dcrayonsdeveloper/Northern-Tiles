<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// These are the extra SKUs found in the doc beyond the original 83
$extras = ['NTD4391','NTD4392','NTD4395','NTD4396','NTD4419','NTD4420','NTD4421','NTD4422','NTD4423','NTD4424','NTD4425','NTD4426','NTD4427','NTD4428','NTD4429','NTD4104','NTD4106'];

$found = DB::table('products')->whereIn('sku', $extras)->select('sku','name','category_id','description')->get();
echo "Extra SKUs in doc: " . count($extras) . "\n";
echo "Found in DB: " . count($found) . "\n\n";

echo "=== IN DB ===\n";
foreach ($found as $p) {
    $dLen = strlen($p->description ?? '');
    echo "  {$p->sku} | cat={$p->category_id} | descLen={$dLen} | name={$p->name}\n";
}

$foundSkus = $found->pluck('sku')->toArray();
$missing = array_diff($extras, $foundSkus);
echo "\n=== NOT IN DB (need create) ===\n";
foreach ($missing as $s) echo "  $s\n";

// Also get total product count in JSON
$data = json_decode(file_get_contents(storage_path('app/products_doc3.json')), true);
echo "\n=== JSON PRODUCT COUNT ===\n";
echo "Total in JSON: " . count($data) . "\n";

// Check NTD4422 name issue
echo "\n=== NTD4422 ===\n";
echo "JSON name: " . ($data['NTD4422']['name'] ?? 'N/A') . "\n";
