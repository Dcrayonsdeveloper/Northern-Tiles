<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== ALL CATEGORIES ===\n";
$cats = DB::table('categories')->orderBy('id')->get();
foreach ($cats as $c) {
    echo "  id={$c->id} | slug={$c->slug} | name={$c->name}\n";
}

echo "\n=== EXISTING PRODUCTS CATEGORIES ===\n";
$skus = ['NTD4435','NTD4436','NTD4437','NTD4438','NTD4397','NTD4398','NTD4399','NTD4400','NTD4401','NTD4402','NTD4368','NTD4369','NTD4370','NTD4371','NTD4439','NTD4440','NTD4430','NTD4447','NTD4448','NTD4449','NTD4450','NTD4451','NTD4452','NTD4453','NTD4454','NTD4455','NTD4456','NTD4457','NTD4458','NTD4459','NTD4460','NTD4461','NTD4462','NTD4463','NTD4464','NTD4465','NTD4466','NTD4467','NTD4468','NTD4469','NTD4470','NTD4178','NTD4179','NTD4180','NTD4181','NTD4182','NTD4377','NTD4378','NTD4379','NTD4380','NTD4381','NTD4382','NTD4393','NTD4394','NTD4417','NTD4418','NTD4071','NTD4072','NTD4105','NTD4107','NTD4108','NTD4109','NTD4110','NTD4111','NTD4130','NTD4132','NTD4133','NTD4134','NTD4137','NTD4413'];
$products = DB::table('products')->whereIn('sku', $skus)->select('sku','name','category_id','slug','description')->get();
foreach ($products as $p) {
    $descLen = strlen($p->description ?? '');
    echo "  {$p->sku} | cat={$p->category_id} | descLen={$descLen} | slug={$p->slug}\n";
}
