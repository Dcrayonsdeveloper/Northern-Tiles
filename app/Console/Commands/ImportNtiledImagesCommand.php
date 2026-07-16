<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\ProductMedia;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportNtiledImagesCommand extends Command
{
    protected $signature = 'ntd:import-ntiled-images
                            {--dry-run : Preview without saving}
                            {--product= : Only process a single product_id}';

    protected $description = 'Download product images from NTiled (Shopify) and store in product_media.';

    /**
     * product_id => ['name', 'ntiled_url', 'images' => [...urls]]
     */
    private array $map = [
        437 => [
            'name'       => 'Moon Grey Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/moon-grey-hybrid-tile',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/IMG_8991.jpg?v=1744608450',
            ],
        ],
        438 => [
            'name'       => 'Terrazzo Grey Hybrid Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/terrazzo-grey-hybrid-tile',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/IMG_8990.jpg?v=1744607773',
            ],
        ],
        439 => [
            'name'       => 'Carrara Hybrid Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/carrara-hybrid-tile',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/IMG_8981.jpg?v=1744607306',
            ],
        ],
        440 => [
            'name'       => 'Concrete Grey Hybrid Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/concrete-grey-hybrid-tile',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/IMG_8987.jpg?v=1744608100',
            ],
        ],
        // --- Herringbone range ---
        441 => [
            'name'       => 'Herringbone Blackbutt Hybrid Tiles',
            'ntiled_url' => 'https://ntiled.com.au/products/herringbone-blackbutt',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_4c37c378-d065-456a-bf83-0d3f21b31a72.jpg?v=1681301047',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_de7cdb36-e413-472d-bdf2-d63e5c6b7706.jpg?v=1681301043',
                // HEIC skipped: image_6672cba3-2d60-4730-848b-cd1603452ef7.heic (not browser-compatible)
            ],
        ],
        442 => [
            'name'       => 'Classic Oak Herringbone Flooring',
            'ntiled_url' => 'https://ntiled.com.au/products/herringbone-dark-oak',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_6fb3fe4d-ddb0-44f9-bf23-a9e2da381c66.jpg?v=1681300830',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/IMG_9823.jpg?v=1722384406',
            ],
        ],
        443 => [
            'name'       => 'Do Smoked Herringbone Flooring',
            'ntiled_url' => 'https://ntiled.com.au/products/herringbone-do-smoked',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_d2254709-53cc-4cb1-abc9-7a819c66cd53.jpg?v=1681300678',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/image_e1082be8-0a2b-47c0-a216-775c9fe2cfa3.jpg?v=1682848620',
            ],
        ],
        444 => [
            'name'       => 'Grey Ghost Herringbone Flooring',
            'ntiled_url' => 'https://ntiled.com.au/products/herringbone-grey-ghost',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_4a34ea8f-127b-49ae-9441-ac84553a8666.jpg?v=1681300937',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2024-07-24_at_1.09.51_pm.png?v=1721790638',
            ],
        ],
        445 => [
            'name'       => 'Hatton Oak Herringbone Flooring',
            'ntiled_url' => 'https://ntiled.com.au/products/herringbone-hatton-oak',
            'images'     => [
                // Only image on NTiled is HEIC (IMG_6758.heic) — not browser-compatible, skipped.
            ],
        ],
        446 => [
            'name'       => 'Spotted Gum Herringbone Flooring',
            'ntiled_url' => 'https://ntiled.com.au/products/herringbone-spotted-gum',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_70ee8c04-3817-425c-a2d0-35578e3a7e8a.jpg?v=1681300766',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_4d0d65a9-13ab-4004-acf6-711e774e4629.jpg?v=1681300767',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_7e651e7e-5d23-43da-b7fe-42c90d1e0acc.jpg?v=1681300768',
            ],
        ],
        // --- Engineered Timber range ---
        447 => [
            'name'       => 'ARIA Engineered Tiles',
            'ntiled_url' => 'https://ntiled.com.au/products/aria-opal-oak-1900x190-14-3',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2025-05-12at11.42.53am.png?v=1747016332',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-12_at_12.29.15_pm.png?v=1747016972',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-12_at_12.32.24_pm.png?v=1747017156',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-12_at_12.33.52_pm.png?v=1747017249',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-12_at_12.35.39_pm.png?v=1747017358',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-12_at_12.37.26_pm.png?v=1747017464',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-12_at_12.39.17_pm.png?v=1747017575',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-12_at_12.47.54_pm.png?v=1747018092',
            ],
        ],
        448 => [
            'name'       => 'DOTA Engineered Tiles',
            'ntiled_url' => 'https://ntiled.com.au/products/dota-opal-origins-1900x190-14-2mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2025-05-09at3.18.29pm.png?v=1746768110',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-09_at_3.22.45_pm.png?v=1746768177',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-09_at_3.32.37_pm.png?v=1746768788',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-09_at_3.34.28_pm.png?v=1746768890',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-09_at_3.36.52_pm.png?v=1746769029',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-09_at_3.38.31_pm.png?v=1746769207',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-09_at_3.41.38_pm.png?v=1746769315',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-09_at_3.42.49_pm.png?v=1746769385',
            ],
        ],
        449 => [
            'name'       => 'Natural Oak Engineered Tiles',
            'ntiled_url' => 'https://ntiled.com.au/products/naturaloak-engineeredtimber',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/29CAA58F-8913-4EDA-8F4C-22DA76BF7EC4.jpg?v=1746765480',
            ],
        ],
        450 => [
            'name'       => 'Natural Oak Herringbone Tiles',
            'ntiled_url' => 'https://ntiled.com.au/products/naturaloakherringbone',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/117083fca9cc7cfdda9b2ba893e32a0.jpg?v=1705638720',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/herringbonenaturaloak.jpg?v=1705638720',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/C1F4187D-DEC2-4470-A393-B1F20AF9A65B.jpg?v=1720348966',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/FFE0F0F2-B89F-4675-8FE2-2DD2F95D1147.jpg?v=1720348966',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/AFD386AB-E181-46E6-8555-0CFABD89DEAC.jpg?v=1720348966',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/DA1FDC67-E4CF-4ED4-AF68-2D17F830F9DB.jpg?v=1720348966',
            ],
        ],
        451 => [
            'name'       => 'Ordel Opal Oak Engineered Tiles',
            'ntiled_url' => 'https://ntiled.com.au/products/ordel-opal-oak-1900x190-15-3mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2025-05-09at4.05.27pm.png?v=1746770808',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-09_at_4.09.34_pm.png?v=1746771028',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-09_at_4.13.03_pm.png?v=1746771195',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-09_at_4.15.19_pm.png?v=1746771333',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-09_at_4.17.28_pm.png?v=1746771512',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-05-09_at_4.22.20_pm.png?v=1746771756',
            ],
        ],
        // --- Wadi range ---
        460 => [
            'name'       => 'Wadi Terra Matt Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/wadi-terra-matt-60x300mm-30061',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0096.jpg?v=1731540841',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU009620LIFESTYLE201.jpg?v=1731540841',
            ],
        ],
        461 => [
            'name'       => 'Wadi Mint Matt Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/wadi-mint-matt-60x300mm-30058',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0095.jpg?v=1731540836',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU009520LIFESTYLE203.jpg?v=1731540836',
            ],
        ],
        462 => [
            'name'       => 'Wadi Taupe Matt Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/wadi-taupe-matt-60x300mm-30057',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0094.jpg?v=1731540830',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU009420LIFESTYLE201.jpg?v=1731540830',
            ],
        ],
        463 => [
            'name'       => 'Wadi Beige Matt Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/wadi-beige-matt-60x300mm-30053',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0092.jpg?v=1731540820',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU009220LIFESTYLE201.jpg?v=1731540820',
            ],
        ],
        464 => [
            'name'       => 'Wadi Stone Matt Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/wadi-stone-matt-60x300mm-30059',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0093.jpg?v=1731540825',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU009320LIFESTYLE201.jpg?v=1731540825',
            ],
        ],
        465 => [
            'name'       => 'Wadi Snow Matt Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/wadi-snow-matt-60x300mm-30052',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0091.jpg?v=1731540814',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU009120LIFESTYLE201.jpg?v=1731540814',
            ],
        ],
        466 => [
            'name'       => 'Subway Matt White Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/subway-matt-white-100x200-wm12n1',
            'images'     => [
                // No images on NTiled for this product
            ],
        ],
        // --- Vibrant Gloss Subway range ---
        467 => [
            'name'       => 'Vibrant Black Gloss Subway Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/vibrant-black-gloss-subway-70x280mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesARG0011.jpg?v=1731540806',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesVibrant_white_black_d977fa67-53f6-4cd1-ad12-22cce711782b.jpg?v=1731540806',
            ],
        ],
        468 => [
            'name'       => 'Vibrant Green Gloss Subway Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/vibrant-green-gloss-subway-70x280mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesARG0010.jpg?v=1731540801',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesVibrant_green.jpg?v=1731540801',
            ],
        ],
        469 => [
            'name'       => 'Vibrant Blue Gloss Subway Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/vibrant-blue-gloss-subway-70x280mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesARG0009.jpg?v=1731540795',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesVibrant_blue.jpg?v=1731540795',
            ],
        ],
        470 => [
            'name'       => 'Vibrant Cream Gloss Subway Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/vibrant-cream-gloss-subway-70x280mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesARG0007.jpg?v=1731540785',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesVibrant_white_black_ad8e22fd-3650-4ac4-abef-504788168ce8.jpg?v=1731540785',
            ],
        ],
        471 => [
            'name'       => 'Vibrant Grey Gloss Subway Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/vibrant-grey-gloss-subway-70x280mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesARG0008.jpg?v=1731540790',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesVibrant_green_grey.jpg?v=1731540790',
            ],
        ],
        472 => [
            'name'       => 'Vibrant White Gloss Subway Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/vibrant-white-gloss-subway-70x280mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesARG0006.jpg?v=1731540779',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesVibrant_white_black.jpg?v=1731540779',
            ],
        ],
        // --- Coco range ---
        473 => [
            'name'       => 'Coco Black Hat Matt Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/coco-black-hat-matt-50x150mm-27982',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0088.jpg?v=1731540770',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0088-lifestyle.jpg?v=1731540770',
            ],
        ],
        474 => [
            'name'       => 'Coco Black Hat Gloss Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/coco-black-hat-gloss-50x150mm-27991',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0087.jpg?v=1731540764',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0087-lifestyle.jpg?v=1731540764',
            ],
        ],
        475 => [
            'name'       => 'Coco Verde Matt Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/coco-verde-matt-50x150mm-27983',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0086.jpg?v=1731540759',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0086-lifestyle.jpg?v=1731540759',
            ],
        ],
        476 => [
            'name'       => 'Coco Verde Gloss Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/coco-verde-gloss-50x150mm-27989',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0085.jpg?v=1731540754',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0085-lifestyle.jpg?v=1731540754',
            ],
        ],
        477 => [
            'name'       => 'Coco Blue Night Matt Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/coco-blue-night-matt-50x150mm-27980',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0084.jpg?v=1731540749',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0084-lifestyle.jpg?v=1731540749',
            ],
        ],
        478 => [
            'name'       => 'Coco Blue Night Gloss Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/coco-blue-night-gloss-50x150mm-27988',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0083.jpg?v=1731540744',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0083-lifestyle.jpg?v=1731540744',
            ],
        ],
        479 => [
            'name'       => 'Coco Blue Grass Gloss Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/coco-blue-grass-gloss-50x150mm-27987',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0081.jpg?v=1731540734',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0081_EQU0083-lifesyle.jpg?v=1731540734',
            ],
        ],
        480 => [
            'name'       => 'Coco Blue Grass Matt Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/coco-blue-grass-matt-50x150mm-27979',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0082.jpg?v=1731540739',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0082-lifestyle.jpg?v=1731540739',
            ],
        ],
        481 => [
            'name'       => 'Coco Amber Grey Matt Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/coco-amber-grey-matt-50x150mm-27981',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0080.jpg?v=1731540729',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0080-lifestyle.jpg?v=1731540729',
            ],
        ],
        482 => [
            'name'       => 'Coco Amber Grey Gloss Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/coco-amber-grey-gloss-50x150mm-27990',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0079.jpg?v=1731540724',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0079-lifestyle.jpg?v=1731540724',
            ],
        ],
        483 => [
            'name'       => 'Coco Orchard Pink Matt Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/coco-orchard-pink-matt-50x150mm-27978',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0078.jpg?v=1731540719',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/httpsclearapi.designerstonesolutions.com_.au8443cswebimagesEQU0078-lifestyle.jpg?v=1731540719',
            ],
        ],
        // --- Baltic Stone range ---
        456 => [
            'name'       => 'Beige Porcelain Tile (Baltic Stone)',
            'ntiled_url' => 'https://ntiled.com.au/products/baltic-stone-beige-600x600mm',
            'images'     => [
                // HEIC (IMG_92592.heic) already imported manually as record #254
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-17at3.40.48pm.png?v=1713332472',
            ],
        ],
        457 => [
            'name'       => 'Baltic Chalk Porcelain Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/baltic-stone-chalk',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/BALTICStone-Chalk.jpg?v=1713266575',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/BALTIC-Stone-Chalk-lifestyle.jpg?v=1713266576',
            ],
        ],
        458 => [
            'name'       => 'Dark Grey Porcelain Tile (Baltic Stone)',
            'ntiled_url' => 'https://ntiled.com.au/products/baltic-stone-dark-grey-600x600mm',
            'images'     => [
                // Only image on NTiled is HEIC (FullSizeRender.heic) — imported manually as record #255
            ],
        ],
        459 => [
            'name'       => 'Baltic Grigio Porcelain Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/baltic-stone-grigio-600x600mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-17at3.18.50pm.png?v=1713331195',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-17at3.19.00pm.png?v=1713331168',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-17at3.19.12pm.png?v=1713331168',
            ],
        ],
        // --- Terrazzo range ---
        484 => [
            'name'       => 'Quartz Terrazzo Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/quartz-terrazzo-grey-600x600',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/8C3C67E2-A277-45C1-93B5-2956A589F34B.jpg?v=1704615923',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/6A4E6C24-48C1-4466-9740-5A66D6154A21.jpg?v=1704616405',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/27D0ABE0-40DF-4D12-83A5-75F8792C692C.jpg?v=1704616405',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/8C3C67E2-A277-45C1-93B5-2956A589F34B_ea103ce5-9e3b-405b-ae36-3ffd01d767e2.jpg?v=1704616405',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/27D0ABE0-40DF-4D12-83A5-75F8792C692C_4ebd00d0-ff05-4988-ba14-132398388655.jpg?v=1704616405',
            ],
        ],
        485 => [
            'name'       => 'Sparkle Terrazzo Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/sparkle-terrazzo-range',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_1509.jpg?v=1631704854',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/SPARKLE_SILVER_MATT_300x600_-_600x600-1920w.jpg?v=1631704524',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/SPARKLE_COFFEE_MATT_300x600_-_600x600-1920w.jpg?v=1631704526',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/SPARKLE_GREY_MATT_300x600_-_600x600-1920w.jpg?v=1631704528',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/SPARKLE_BEIGE_MATT_300x600_-_600x600-1920w.jpg?v=1631704530',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/grey-square-2.jpg?v=1631704840',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/beige-square-1.jpg?v=1631704827',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/sksi2424mf-300x600.jpg?v=1631704703',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/skgr2424mf-300x600.jpg?v=1631704705',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/skbe2424mf-300x600.jpg?v=1631704714',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/SPARKLE_COFFEE_MATT_300x600_-_600x600-1920w_93c0ebb4-cce9-4978-9841-f40147484c64.jpg?v=1631704788',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/SPARKLE_COFFEE_MATT_300x600_-_600x600-1920w_bffe8bc3-e5bf-4b48-b1fb-1e87b699bf72.jpg?v=1631705388',
            ],
        ],
        486 => [
            'name'       => 'Grey Terrazzo Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/terrazzo-grey-ntd130',
            'images'     => [
                // Only image is HEIC — imported manually as media #341
            ],
        ],
        487 => [
            'name'       => 'Light Grey Terrazzo Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/gem-light-grey-600x600',
            'images'     => [
                // Skipping HEIC images; importing non-HEIC only
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/GEM_LIGHT_GREY_MATT_600x600_-_600x1200-1920w.jpg?v=1629195805',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_96cce2bf-7883-491e-abbc-32db9aa85d25.jpg?v=1674077533',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_c30d5a6f-753b-4713-931f-fb50f82cd10c.jpg?v=1674077533',
            ],
        ],
        // --- Venetian Marble range ---
        488 => [
            'name'       => 'Venetian Marble Cloud',
            'ntiled_url' => 'https://ntiled.com.au/products/venetian-marble-cloud',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/02689_VENETIAN_MARBLE_CLOUD_60x60_b96abd90-2654-4b02-b723-49a6e5346205.jpg?v=1628656094',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_1054.jpg?v=1628761122',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_8973.jpg?v=1629113031',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_8974.jpg?v=1629113031',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/VENETIAN_MARBLE_BAR_1.jpg?v=1629113031',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/Venetianmarblecloud.png?v=1629113031',
            ],
        ],
        489 => [
            'name'       => 'Venetian Marble Fog',
            'ntiled_url' => 'https://ntiled.com.au/products/venetian-marble-fog',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/02690_VENETIAN_MARBLE_FOG_60x60_1.jpg?v=1628655835',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/VENETIAN_MARBLE_BAGNO_1_b8d39651-8385-44f2-b6e8-8407b34089fa.jpg?v=1628656288',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/posafog60x60_1.jpg?v=1628656288',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/VenetianMarbleFog.png?v=1628656129',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/VENETIAN_MARBLE_BAGNO_PART_1.jpg?v=1628656365',
            ],
        ],
        490 => [
            'name'       => 'Venetian Marble Rainbow',
            'ntiled_url' => 'https://ntiled.com.au/products/venetian-marble-rainbow',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/02688_VENETIAN_MARBLE_RAINBOW_60x60_be2c837e-cdd7-4adb-8cc9-8db843d9596f.jpg?v=1628655768',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/VENETIAN_MARBLE_NEGOZIO_2_PART_1_1.jpg?v=1628655768',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/VenetianMarbleRainbow.png?v=1628655768',
            ],
        ],
        491 => [
            'name'       => 'Venetian Marble Storm',
            'ntiled_url' => 'https://ntiled.com.au/products/venetian-marble-storm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/02691_VENETIAN_MARBLE_STORM_60x60_1.jpg?v=1628655708',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/VENETIAN_MARBLE_BAGNO_1.jpg?v=1628655708',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/VenetianMarbleStorm.png?v=1628655708',
            ],
        ],
        // --- Concrete Italian range ---
        492 => [
            'name'       => 'Concrete Black Italian Porcelain Tiles',
            'ntiled_url' => 'https://ntiled.com.au/products/concrete-black',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/00927_60x60_concreteblacknat.jpg?v=1628658577',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/CONCRETE_BLACK_LIVING.jpg?v=1628658578',
            ],
        ],
        493 => [
            'name'       => 'Concrete White Italian Porcelain Tiles',
            'ntiled_url' => 'https://ntiled.com.au/products/concrete-white',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/00923_60x60_concretewhitenat_ef99cf44-4e17-46ce-8977-208961d899b4.jpg?v=1628658398',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/CONCRETE_WHITE_PROFUMERIA.jpg?v=1628658398',
            ],
        ],
        494 => [
            'name'       => 'Concrete Taupe Italian Porcelain Tiles',
            'ntiled_url' => 'https://ntiled.com.au/products/concrete-taupe',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/00924_60x60_concretetaupenat.jpg?v=1628658366',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/CONCRETE_TAUPE_LIVING.jpg?v=1628658374',
            ],
        ],
        495 => [
            'name'       => 'Concrete Warm Grey Italian Porcelain Tiles',
            'ntiled_url' => 'https://ntiled.com.au/products/concrete-warm-grey',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/00926_60x60_concretewarmgreynat.jpg?v=1628658461',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/CONCRETE_WARM_GREY_LIVING.jpg?v=1628658461',
            ],
        ],
        // --- Stone Focus range ---
        496 => [
            'name'       => 'Stone Focus Grigio Tiles',
            'ntiled_url' => 'https://ntiled.com.au/products/stone-focus-grigio',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/01035_focusgrigionat60x60_1.jpg?v=1628660958',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/STONE_FOCUS_GRIGIO_LIVING_1.jpg?v=1628660961',
            ],
        ],
        497 => [
            'name'       => 'Stone Tortora Tiles',
            'ntiled_url' => 'https://ntiled.com.au/products/stone-focus-tortora',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/01034_focustortoranat60x60.jpg?v=1628660755',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/STONE_FOCUS_TORTORA_RISTORANTE.jpg?v=1628660779',
            ],
        ],
        498 => [
            'name'       => 'Stone Focus Piombo Tiles',
            'ntiled_url' => 'https://ntiled.com.au/products/stone-focus-piombo',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/01036_focuspiombonat60x60.jpg?v=1628660717',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/STONE_FOCUS_PIOMBO_BAR.jpg?v=1628660717',
            ],
        ],
        // --- X Rock range ---
        499 => [
            'name'       => 'X Rock Black Porcelain Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/x-rock-black',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/xrockblack600x600mm.jpg?v=1630409418',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/xrock-black-squ6_1.jpg?v=1630543268',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/xrock-black-squ-2_1.jpg?v=1630543268',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/xrock-grey-squ-2_1.jpg?v=1630543271',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/xrock-grey-squ-ext-1_1.jpg?v=1630543271',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/xrock-grey-squ-1.jpg?v=1630543272',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/x_rock_black_external_600x300_7dfa0407-38bd-41ba-8dc2-e2ce188d50d2.jpg?v=1630543272',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/x_rock_black_600x600mm.jpg?v=1630543272',
            ],
        ],
        500 => [
            'name'       => 'X Rock Grey Porcelain Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/x-rock-grey-600x600mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/xrockgrey60x60.jpg?v=1630408692',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/x_rock_grey_external_600x300_575ad682-5627-4452-98a0-abc151fbd8f6.jpg?v=1630408692',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/xrock_grey_60x60_35137f9d-94f1-4cd3-a5e5-2ef9566b786d.jpg?v=1630408909',
            ],
        ],
        501 => [
            'name'       => 'X Rock White Porcelain Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/x-rock-white-600x600mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/xrockwhite600x600mm.jpg?v=1725357089',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_6035c128-d63e-4fea-9b3a-2cd83b0322f3.jpg?v=1725357089',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/X-ROCK-WHITE-MATT.jpg?v=1725357089',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/xrock-white-squ-ext-3.jpg?v=1725357089',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/x_rock_white_600x300_37f57389-1c4f-4661-aef0-c01a0c0fd984.jpg?v=1725357089',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/x_rock_white_600x600mm.jpg?v=1725357089',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_3ff1a793-fcba-4431-b8c4-d6e6a32fb3ff.jpg?v=1725357089',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_52061312-eef0-4729-9cfc-6a5b2d2c3df6.jpg?v=1725357089',
            ],
        ],
        // --- Sward Porcelain range ---
        452 => [
            'name'       => 'Sward Dark Grey Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/sward-grey-600x600mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-11-15at11.20.50am.png?v=1731632647',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-11-15at11.22.15am.png?v=1731632647',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-11-15at11.17.48am.png?v=1731632647',
            ],
        ],
        453 => [
            'name'       => 'Sward Grey Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/sward-grey-600x600mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-11-15at11.20.50am.png?v=1731632647',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-11-15at11.22.15am.png?v=1731632647',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-11-15at11.17.48am.png?v=1731632647',
            ],
        ],
        454 => [
            'name'       => 'Sward Sand Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/sward-sand-600x600mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-11-15at11.20.41am.png?v=1731632528',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-11-15at11.18.24am.png?v=1731632528',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2024-11-15_at_11.17.39_am.png?v=1731632846',
            ],
        ],
        455 => [
            'name'       => 'Sward White Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/sward-white-600x600mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-11-15at11.20.33am.png?v=1731632141',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-11-15at11.18.31am.png?v=1731632141',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2024-11-15_at_11.17.05_am.png?v=1731632943',
            ],
        ],
        // --- Moderna / Montagna / Entiva / Ceppo / Stone ranges (doc 8) ---
        502 => [
            'name'       => 'Moderna Scuro Porcelain Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/modernascuro',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/P6A0718.jpg?v=1629107079',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/2.jpg?v=1629107079',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/3.jpg?v=1629107079',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/273244595_635245744368434_5375159328752528138_n.jpg?v=1646286486',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/273904457_353750709954034_1643082171792187676_n.jpg?v=1646286500',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/P6A0718_53a70f60-775a-4e9f-a645-3b5602c7afc4.jpg?v=1651657522',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/TK21204MG_6.jpg?v=1651657538',
            ],
        ],
        503 => [
            'name'       => 'Moderna Grigio Porcelain Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/modernagrigio',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/P6A0703-3.jpg?v=1629107364',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/1.jpg?v=1629107364',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/2_e1c69626-686f-4549-ab4d-cceb1031b246.jpg?v=1629107364',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/4.jpg?v=1629107364',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/274161598_500287791706847_1522158080754543173_n.jpg?v=1646286967',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/273535189_624780205228731_3336419162012162024_n.jpg?v=1646286974',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/TK21203MG_1_-1.jpg?v=1651657406',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/P6A0699-3.jpg?v=1651657409',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/TK21203MG_1_-1_9c4763c2-a1d3-4d55-8774-4a47d286cf5a.jpg?v=1651657434',
            ],
        ],
        504 => [
            'name'       => 'Moderna Bianco Porcelain Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/modernabianco',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/P6A0706-1_c431661c-23ab-4a29-a6ea-799a9977490d.jpg?v=1629107244',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/6.jpg?v=1629107244',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/4_47ca68c3-f0fb-45b9-9908-be466a524409.jpg?v=1629107244',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/2_39c2005c-b53b-44dd-a613-b858b3ec5e13.jpg?v=1629107244',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/10-1.jpg?v=1629107244',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/12.jpg?v=1629107244',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/13.jpg?v=1629107244',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/273773858_968693724013293_6543083219404300483_n.jpg?v=1646287185',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/272997009_485596533062330_1365238858400608282_n.jpg?v=1646287190',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/P6A0706-1.jpg?v=1651657223',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/TK21202MG_2_-1.jpg?v=1651657224',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/P6A0706-1_df8c1b44-308c-4201-9625-ea83a351d23e.jpg?v=1651657266',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/P6A0708-1.jpg?v=1651657322',
            ],
        ],
        505 => [
            'name'       => 'Montagna Grigio Porcelain Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/montagna-grigio-600x600mm-x-20mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_5f6a7a7d-e5f6-4496-8912-005763ac5b69.jpg?v=1650707451',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_bf85625b-00df-49d1-8e4a-3ba68a88a444.jpg?v=1650707451',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_280fe61a-851f-4280-9ed7-f805f692ec26.jpg?v=1650707451',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_7756832a-ebe0-404e-b8e8-4bfea580e10a.jpg?v=1650707451',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_d1651be2-4892-42fd-af79-fd1e585aa198.jpg?v=1650707451',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/bc17de44-1783-4f15-ad64-9aca5d627939.jpg?v=1651656869',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_4730_2.jpg?v=1651656873',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_eab8cf3a-d331-42d8-82eb-4b6de8bacb61.jpg?v=1660115880',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_7f30879f-6f25-4dea-bd9a-d686273d9e94.jpg?v=1660115887',
                // 2 HEIC files handled via Python conversion (see HEIC import script)
            ],
        ],
        506 => [
            'name'       => 'Montagna Scuro Porcelain Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/montagna-scuro-600x600x20mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_2074c59a-9375-4d7b-a2c7-dac727aa1ac8.jpg?v=1650700980',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_5c6deb1c-03f1-413a-8992-a41abd059a42.jpg?v=1650700980',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_66e98bc9-225c-41dc-ba60-8da0c599acfd.jpg?v=1650700980',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_a347ceae-9f88-4501-8ab4-bb382d0655dc.jpg?v=1651656921',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_c08e2183-3830-43c0-8e47-4cf49c70664a.jpg?v=1651656921',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_4729_2.jpg?v=1651656993',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/7d95c8f8-9150-4610-a5e2-106459b2ee46.jpg?v=1651656998',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_4729_2_2e154b9f-d960-488a-b3fe-df042ce8d10d.jpg?v=1651657039',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/055363B2-9D39-4FA7-86D0-E0148CA1F801.jpg?v=1698533954',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/A0FCD009-4609-4164-B811-0EFC90F4DA60.jpg?v=1698533954',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/C50B79C7-DD02-4B4E-8EAC-3448BA7E49F7.jpg?v=1698533954',
                // 1 HEIC file handled via Python conversion
            ],
        ],
        507 => [
            'name'       => 'Entiva Cross Cut Silver Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/entiva-cross-cut-silver-20mm-600x600mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/2728.png?v=1629108291',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_5515.jpg?v=1629108564',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_8685.jpg?v=1714974538',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_5cb848b7-9379-4f85-95f7-9f73a3d174ee.jpg?v=1631416672',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_9167a62a-2c5b-4ae9-93b9-4f8765d74ce0.jpg?v=1631416675',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_2f1f5aba-35e4-4ab8-9c33-ba00ea57d69e.jpg?v=1631416675',
            ],
        ],
        508 => [
            'name'       => 'Entiva Cross Cut Dark Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/entiva-cross-cut-dark-20mm-600x600mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/2729.png?v=1629108659',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_5504.jpg?v=1629108732',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_5503.jpg?v=1629108732',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_5517.jpg?v=1629108732',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_5502.jpg?v=1629108732',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/1708.jpg?v=1629108732',
            ],
        ],
        509 => [
            'name'       => 'Ceppo Medium Porcelain Tiles',
            'ntiled_url' => 'https://ntiled.com.au/products/ceppo-medium-20mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/c075c469e49847469463500920b774f8.jpg?v=1690177077',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/f7c279fce3014379926e24005427751d.jpg?v=1690177077',
            ],
        ],
        510 => [
            'name'       => 'Bluestone Catpaws Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/bluestone-600x600mmx20mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/edcb79e8f55f4b4d959a334a18b3f157.jpg?v=1653821268',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/afc37110e9ce4eaf99e8e32922a89432.jpg?v=1653821268',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/7182267adcda4b43b059a6fb46965c82.jpg?v=1653821266',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/edcb79e8f55f4b4d959a334a18b3f157_6806d8f1-1e02-4c29-a686-74b384cfecf5.jpg?v=1653821305',
            ],
        ],
        511 => [
            'name'       => 'Pool Skimmer Lid',
            'ntiled_url' => 'https://ntiled.com.au/products/pool-smart-waste',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_2706e005-6e03-4393-8cb7-f50bcd645ebc.jpg?v=1707198247',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/IMG_55232.jpg?v=1707198247',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_67905f1b-a0c2-4fd1-aa0e-ee32a877c235.jpg?v=1707198247',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/skimmerlidBurdur.jpg?v=1707198247',
                // 3 HEIC files handled via Python conversion
            ],
        ],
        512 => [
            'name'       => 'Travertino Crema Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/travertino-crema-600x600mm-x20mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_6178_d6de3731-1881-46b4-b2ec-dfbc5faa29bb.jpg?v=1659331346',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_6178.jpg?v=1659331346',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_6180.jpg?v=1659331346',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_6179.jpg?v=1659331346',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_6029.jpg?v=1659331342',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_6031.jpg?v=1659331342',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_6180_90a9efe3-0d18-4444-b2a4-e44b03518073.jpg?v=1659331334',
            ],
        ],
        513 => [
            'name'       => 'Tundra Grey Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/tundra-grigio-20mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Tundra-Grey-pd.jpg?v=1688551342',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/TundraGrey-1000.jpg?v=1688551342',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/image_b14d0c66-2c09-4c10-ac2f-e5106a88a75c.jpg?v=1688551342',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/image_6bc0a9ca-6423-4c8a-9669-564d1fd10135.jpg?v=1688551342',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/image_546d01e0-bd38-47a2-b0e2-ed1025393a62.jpg?v=1688551342',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/image_05a8feb2-e6f4-40aa-83e1-7dbe9f38dc4e.jpg?v=1688551342',
                // 2 HEIC files handled via Python conversion
            ],
        ],
        514 => [
            'name'       => 'Tundra White Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/tundra-bianco-20mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/tundra_white_SW_600x600_ds_09.22_ml_55b98ef5-6b17-44bc-9255-eb99eb2e2a91.jpg?v=1732761406',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Tundra-WhiteFP-pd.jpg?v=1688551472',
            ],
        ],
        515 => [
            'name'       => 'Ceppo Stone Light Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/ceppo-light-20mm-600x600mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/0c543bb296e34f9c8480b2ee07edfe81.jpg?v=1690177815',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/5a0795f345694c0eaa0a477ddbdc1359.jpg?v=1690177815',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/a2d54c85446f415abf70b36e2a5dbd8f.jpg?v=1690177815',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/2d9a5ecd50144be582f809fa696d755d.jpg?v=1690177815',
            ],
        ],
        516 => [
            'name'       => 'Ceppo Stone Dark Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/ceppo-dark-20mm-600x600mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/8536e2910be446548f5880b2cd74c21e.jpg?v=1690178376',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/2821eb61fd76416093132c2c7435c565.jpg?v=1690178390',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/c0507aef678948ffaf4b6750d6d87365.jpg?v=1690178390',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/b11df22ce97f4d019e1fd856ed33a065.jpg?v=1690178390',
            ],
        ],
        517 => [
            'name'       => 'Stone Light Grey Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/light-grey-stone-600x600',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/dbbe8948-08d6-47f7-975f-556a3914ddd6.jpg?v=1708315946',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/3e865606-48d8-4a57-93a0-4bf3a63cd59c.jpg?v=1708315947',
            ],
        ],
        518 => [
            'name'       => 'Stone Grey Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/grey-stone-600x600',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/5eef8ef6-0e26-4a2b-8e7b-1084709a5afe.jpg?v=1708316136',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ba7a23fa-540c-4805-96fd-d3796b43fcda.jpg?v=1708316137',
            ],
        ],
        519 => [
            'name'       => 'Stone Charcoal Grey Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/charcoal-grey-stone-600x600',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/cb9dca2d-f53c-46a3-8e6e-2b48a63d69a3.jpg?v=1708316207',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/feaf9c4c-b8b1-4906-90eb-99112a14624c.jpg?v=1708316208',
            ],
        ],
        520 => [
            'name'       => 'Baltic Stone Beige Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/baltic-stone-beige-600x600mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-17at3.40.48pm.png?v=1713332472',
                // 1 HEIC file handled via Python conversion
            ],
        ],
        521 => [
            'name'       => 'Baltic Stone Grigio Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/baltic-stone-grigio-600x600mm',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-17at3.18.50pm.png?v=1713331195',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-17at3.19.00pm.png?v=1713331168',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-17at3.19.12pm.png?v=1713331168',
            ],
        ],
        522 => [
            'name'       => 'Baltic Stone Dark Grey Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/baltic-stone-dark-grey-600x600mm',
            'images'     => [
                // Only image is HEIC — handled via Python conversion
            ],
        ],
        // --- Tiling spacers, wedges & Mapei chemicals (doc 9) ---
        523 => [
            'name'       => '1.5mm Tile Crosses (2000PCS)',
            'ntiled_url' => 'https://ntiled.com.au/products/1-5mm-crosses-2000pcs',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_c09fefaa-dd64-422b-8a87-1c603f7dd58d.jpg?v=1623151642',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_a7b41994-dfad-45f5-b0e5-2b48aaf3db60.jpg?v=1623151643',
            ],
        ],
        524 => [
            'name'       => '1.5mm Tile Crosses (500pcs)',
            'ntiled_url' => 'https://ntiled.com.au/products/1-5mm-crosses-500pcs',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_4cdceb54-ccb8-49e6-ad9d-5c0903a3fcdf.jpg?v=1623152547',
            ],
        ],
        525 => [
            'name'       => '2mm Tile Crosses (2000PCS)',
            'ntiled_url' => 'https://ntiled.com.au/products/2mm-crosses-2000pcs',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_65859062-25b2-4353-a3d3-fbc22e2d34b8.jpg?v=1623151938',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_ae873a6e-2a58-432c-b6ee-68dcb5da50f3.jpg?v=1623152040',
            ],
        ],
        526 => [
            'name'       => '2MM Tile Crosses Bucket (2000PCS)',
            'ntiled_url' => 'https://ntiled.com.au/products/2mm-crosses-bucket-2000pcs',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_c92a353b-f23e-431c-bec8-4c04810a50ea.jpg?v=1623238011',
            ],
        ],
        527 => [
            'name'       => '2MM Deep Tile Crosses (2000PCS)',
            'ntiled_url' => 'https://ntiled.com.au/products/2mm-2000pcs-deep-crosses',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_19c14d21-d476-43c3-9405-b96066e74144.jpg?v=1630387971',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_f894a34c-2767-47dc-9ea6-ab8ed5c11ebc.jpg?v=1630387971',
            ],
        ],
        528 => [
            'name'       => '3MM Tile Crosses (2000PCS)',
            'ntiled_url' => 'https://ntiled.com.au/products/3mm-crosses-2000pcs',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_d4c378ca-7149-44a5-bc26-06644a7a8a6e.jpg?v=1623152348',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_030fe6b6-9c03-411a-b306-71dbc57028f8.jpg?v=1623152352',
            ],
        ],
        529 => [
            'name'       => '3MM Tile Crosses Bucket (2000PCS)',
            'ntiled_url' => 'https://ntiled.com.au/products/3mm-crosses-bucket-2000pcs',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_a3a16f74-5e57-4f43-9ed7-ff5af8b51a3e.jpg?v=1623237904',
            ],
        ],
        530 => [
            'name'       => '3MM Deep Tile Crosses (2000PCS)',
            'ntiled_url' => 'https://ntiled.com.au/products/3mm-deep-crosses-2000pcs',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_0a5a0cf3-299e-4036-93a8-d0dc2d477fde.jpg?v=1623151368',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_1ef9f86b-bf28-4fcf-ba80-77b1bcd50226.jpg?v=1623151370',
            ],
        ],
        531 => [
            'name'       => '6MM Red Wedges (1000PC Bag)',
            'ntiled_url' => 'https://ntiled.com.au/products/6mm-red-wedge',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_dd9f6e53-b9d8-4ecd-8fea-ca67fa842b53.jpg?v=1623150103',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_ac851247-f903-46e1-82b6-bd24f1f73ff6.jpg?v=1623150108',
            ],
        ],
        532 => [
            'name'       => 'Eco Prim Grip 5kg',
            'ntiled_url' => 'https://ntiled.com.au/products/eco-prim-grip-5kg',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ecoprim10kg_c0636a0a-bf51-44ab-8a4e-07bae87d92e3.png?v=1692069380',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ecoprimback_e48c1e34-1494-44d5-8d03-ad0f3434cca8.jpg?v=1692069380',
            ],
        ],
        533 => [
            'name'       => 'Keraflex Maxi S1 White',
            'ntiled_url' => 'https://ntiled.com.au/products/keraflex-maxi-s1',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/MAPUA118_1.jpg?v=1692068492',
            ],
        ],
        534 => [
            'name'       => 'Eco Prim Grip Primer 10kg',
            'ntiled_url' => 'https://ntiled.com.au/products/eco-prim-grip-10kg',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ecoprim10kg.png?v=1692069053',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ecoprimback.jpg?v=1692069059',
            ],
        ],
        535 => [
            'name'       => 'Mapelastic Smart',
            'ntiled_url' => 'https://ntiled.com.au/products/mapelastic-smart',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/4_2013-mapelastic-smart-aus-part-a-and-b_840b0dd4f5d746c2a7dc15bb2bb30e52_1.png?v=1692071284',
            ],
        ],
        536 => [
            'name'       => 'Uc Leveller Levelling Compound 20kg',
            'ntiled_url' => 'https://ntiled.com.au/products/uc-leveller-20kg',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/MAPPA253_1.jpg?v=1692068721',
            ],
        ],
        // --- ATA adhesives & primers range (doc 10) ---
        537 => [
            'name'       => 'Ata Ausflex Multi',
            'ntiled_url' => 'https://ntiled.com.au/products/ausflex-multi',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at2.27.33pm.png?v=1708486103',
            ],
        ],
        538 => [
            'name'       => 'Aus Bond Primer',
            'ntiled_url' => 'https://ntiled.com.au/products/ata-aus-bond-primer-grout-mortar-admix',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-08at11.29.33am.png?v=1712540669',
            ],
        ],
        539 => [
            'name'       => 'Aus Bond Ultra Primer',
            'ntiled_url' => 'https://ntiled.com.au/products/ata-aus-bond-ultra-prime',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-08at11.29.48am.png?v=1712540467',
            ],
        ],
        540 => [
            'name'       => 'Aus Crete MPA',
            'ntiled_url' => 'https://ntiled.com.au/products/aus-crete-mpa-20kg',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/95024Aus-CreteMPAA3.png?v=1741754871',
            ],
        ],
        541 => [
            'name'       => 'Aus Screed N Render',
            'ntiled_url' => 'https://ntiled.com.au/products/ata-aus-screed-n-render-normal-set-25kg',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2024-09-04_at_3.15.10_pm.png?v=1725427009',
            ],
        ],
        542 => [
            'name'       => 'Aus Flex Multi Commercial',
            'ntiled_url' => 'https://ntiled.com.au/products/ata-aus-flex-multi-com-green-bag-20kg',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2024-09-04_at_1.51.10_pm.png?v=1725422041',
            ],
        ],
        543 => [
            'name'       => 'Ata Aus Crete Pro Premium Industrial',
            'ntiled_url' => 'https://ntiled.com.au/products/ata-aus-crete-pro-premium-industrial',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at2.17.59pm.png?v=1708485725',
            ],
        ],
        544 => [
            'name'       => 'Ata Aus Crete Super Grey',
            'ntiled_url' => 'https://ntiled.com.au/products/aus-crete-maroon',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at2.24.27pm.png?v=1708485910',
            ],
        ],
        // --- Efflock waterproofing range (doc 11) ---
        545 => [
            'name'       => 'Efflock Waterproofing Solution 1L',
            'ntiled_url' => 'https://ntiled.com.au/products/efflock-1l',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-08at9.10.32am_fb396aae-1f38-42e3-802c-a20ef90c2ac4.png?v=1712532910',
            ],
        ],
        546 => [
            'name'       => 'Efflock Waterproofing Solution 5L',
            'ntiled_url' => 'https://ntiled.com.au/products/efflock-5l',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-08at9.10.32am.png?v=1712532762',
            ],
        ],
        547 => [
            'name'       => 'Efflock Waterproofing Solution 20L',
            'ntiled_url' => 'https://ntiled.com.au/products/efflock-20l',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-08at9.10.32am_9674a171-416f-4037-a83e-40ff9dc35f92.png?v=1712533026',
            ],
        ],
        // --- Soudal All-Purpose Silicone Sealant range (doc 12) ---
        548 => [
            'name'       => 'Moss Green Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-moss-green-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at12.24.08pm.png?v=1708052881',
            ],
        ],
        549 => [
            'name'       => 'Medium Grey Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-medium-grey-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at12.48.26pm.png?v=1708048117',
            ],
        ],
        550 => [
            'name'       => 'Brilliant White Silicone Caulk',
            'ntiled_url' => 'https://ntiled.com.au/products/copy-of-all-purpose-silicone-brilliant-white',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at11.53.44am.png?v=1708044843',
            ],
        ],
        551 => [
            'name'       => 'Black Silicone Caulk',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-black-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at2.05.35pm.png?v=1708052751',
            ],
        ],
        552 => [
            'name'       => 'Aluminium Silicone Caulk',
            'ntiled_url' => 'https://ntiled.com.au/products/copy-of-all-purpose-silicone-aluminium-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at12.56.14pm.png?v=1708048587',
            ],
        ],
        553 => [
            'name'       => 'Grey Silicone Caulk',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-grey-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at12.41.40pm.png?v=1708047814',
            ],
        ],
        554 => [
            'name'       => 'Taupe Silicone Caulk',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-taupe-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at12.25.45pm.png?v=1708047457',
            ],
        ],
        555 => [
            'name'       => 'Translucent Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-translucent',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at11.47.48am.png?v=1708044483',
            ],
        ],
        556 => [
            'name'       => 'Charcoal Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-charcoal-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at2.03.45pm.png?v=1708052645',
            ],
        ],
        557 => [
            'name'       => 'Pewter Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-pewter-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at1.53.11pm.png?v=1708052004',
            ],
        ],
        558 => [
            'name'       => 'Cement Grey Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-cement-grey-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at12.52.33pm.png?v=1708048404',
            ],
        ],
        559 => [
            'name'       => 'Dark Grey Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-dark-grey-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at12.51.28pm.png?v=1708048303',
            ],
        ],
        560 => [
            'name'       => 'Misty Grey Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-misty-grey-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at12.39.07pm.png?v=1708047562',
            ],
        ],
        561 => [
            'name'       => 'Stone Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-stone-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at12.24.55pm.png?v=1708046805',
            ],
        ],
        562 => [
            'name'       => 'Beige Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-beige-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at12.03.54pm.png?v=1708045454',
            ],
        ],
        563 => [
            'name'       => 'Ivory Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-ivory-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at11.58.48am.png?v=1708045139',
            ],
        ],
        564 => [
            'name'       => 'Alabaster Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-alabaster-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at11.57.29am.png?v=1708045063',
            ],
        ],
        565 => [
            'name'       => 'Titanium Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/all-purpose-silicone-titanium-300ml',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-16at11.55.44am.png?v=1708044960',
            ],
        ],
        // --- Hybrid-matched Quad / Scotia trim range (doc 13) ---
        566 => [
            'name'       => 'Classic Oak Quad Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/quad-classic-oak',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_2611.png?v=1637664776',
            ],
        ],
        567 => [
            'name'       => 'NSW Spotted Gum Quad Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/quad-nsw-spotted-gum',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_2614.png?v=1637664217',
            ],
        ],
        568 => [
            'name'       => 'Salem Oak Quad Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/quad-salem-oak-1',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_2607.png?v=1637664845',
            ],
        ],
        569 => [
            'name'       => 'Blackbutt Quad Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/quad-blackbutt',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_2610.png?v=1637664670',
            ],
        ],
        570 => [
            'name'       => 'Grey Oak Quad Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/quad-grey-oak',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_2608.png?v=1637664379',
            ],
        ],
        571 => [
            'name'       => 'Hatton Oak Quad Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/quad-hatton-oak',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_2612.png?v=1637664540',
            ],
        ],
        572 => [
            'name'       => 'Jarrah Quad Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/quad-jarrah',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_2609.png?v=1637664440',
            ],
        ],
        573 => [
            'name'       => 'Rustic Grey Quad Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/quad-rustic-grey',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_25a5c74e-16e8-4496-baa5-6d6f653d9861.png?v=1632830204',
            ],
        ],
        574 => [
            'name'       => 'Rustic Brown Quad Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/quad-rustic-brown',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_2e432d88-08d8-47fe-9ae3-5cd39e69c9b0.png?v=1632830474',
            ],
        ],
        575 => [
            'name'       => 'Rustic Oak Quad Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/quad-rustic-oak',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/image_76d86744-d8ba-4bc7-905d-e9ba12a55f33.png?v=1632830332',
            ],
        ],
        576 => [
            'name'       => 'Grey Ghost Quad Tile',
            'ntiled_url' => 'https://ntiled.com.au/products/quad-grey-ghost',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/products/IMG_2615.png?v=1637664121',
            ],
        ],
        // --- doc21: ARDEX silicones, grouts, X18 adhesive, grout booster ---
        577 => [
            'name'       => 'Ardex Misty Grey Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-se-silicone-misty-grey',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.01.42pm_4f2f5916-23e0-4031-a772-1bd4c8e236c1.png?v=1712892385',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.54.54pm_3a04e240-b8f7-4e83-9aa1-41d8660fd4f7.png?v=1712894338',
            ],
        ],
        578 => [
            'name'       => 'Ardex SE Mudberry Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-se-silicone-mudberry',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.01.42pm_8f58e5b5-b47b-439e-bcce-e4508e8dd672.png?v=1712892573',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.54.54pm_5f0d0ac1-a21b-4eea-9c74-ddcd44b89cf9.png?v=1712894356',
            ],
        ],
        579 => [
            'name'       => 'ARDEX X18 Tile Adhesive',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-x18',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-11-18at12.26.42pm.png?v=1731896120',
            ],
        ],
        580 => [
            'name'       => 'ARDEX FG8 GROUT 5KG',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-285-mudberry',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_433314a3-f2ba-47b2-a464-a2337b39d2f2.png?v=1713147863',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.23.27pm.png?v=1713147870',
            ],
        ],
        581 => [
            'name'       => 'ARDEX Magellan Grey Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/copy-of-ardex-se-silicone-magellan-grey',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.01.42pm_0517177b-81d5-4bac-8f80-1e5b22797f9f.png?v=1712892669',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.54.54pm_903afbde-5da5-4051-a1a1-a289f3cf9b6c.png?v=1712894279',
            ],
        ],
        582 => [
            'name'       => 'ARDEX FSDD GROUT 5KG MISTY GREY',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fsdd-grout-5kg-341-misty-grey',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_3.12.38_pm.png?v=1745471818',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_2.40.17_pm.png?v=1745471818',
            ],
        ],
        583 => [
            'name'       => 'ARDEX F8G GROUT 5KG',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-241-misty-grey',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_1f7607d1-6903-4cf4-bc36-d624b8f4f4cf.png?v=1713148342',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.31.07pm.png?v=1713148343',
            ],
        ],
        584 => [
            'name'       => 'ARDEX Macchiato Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-se-silicone-macchiato',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.01.42pm_1bbb79cc-9b39-40a1-acac-f3e5c07879d8.png?v=1712892528',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.54.54pm_220c7366-b583-4eb4-bfab-7f5eaa15a932.png?v=1712894256',
            ],
        ],
        585 => [
            'name'       => 'ARDEX Charred Ash Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-se-silicone-charred-ash',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.01.42pm_7101ee41-a7a1-4a82-a2c5-13b828be37b1.png?v=1712892298',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.54.54pm_24af78ec-ae41-42a6-886b-9dfddb484580.png?v=1712894166',
            ],
        ],
        586 => [
            'name'       => 'ARDEX Havana Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-se-silicone-havana',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.01.42pm_4c99de14-0d51-4553-b325-e356060e07ea.png?v=1712892143',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.54.54pm_ec7f1c8c-2b40-4bc7-b675-0733e82370e2.png?v=1712894235',
            ],
        ],
        587 => [
            'name'       => 'ARDEX FG8 Grout 20KG Travertine',
            'ntiled_url' => 'https://ntiled.com.au/products/copy-of-ardex-fg8-grout-277-travertine',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_cde7f006-4e07-4ee9-8233-1c48d3c806a8.png?v=1708482391',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at1.26.47pm.png?v=1708482417',
            ],
        ],
        588 => [
            'name'       => 'ARDEX FG8 Grout 5KG Olive',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-295-olive',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_6ec09c78-1bfa-4709-88d4-70aae55ab505.png?v=1713148241',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.29.44pm.png?v=1713148241',
            ],
        ],
        589 => [
            'name'       => 'ARDEX FG8 Grout 5KG',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-227-todd-river-sand',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_5c33013e-14cf-4967-9665-031d2757b09b.png?v=1713147756',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.22.20pm.png?v=1713147756',
            ],
        ],
        590 => [
            'name'       => 'ARDEX Slate Grey Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-se-silicone-slate-grey',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.01.42pm_0d281d87-261f-4a74-8ce9-f8407245f392.png?v=1712892429',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.54.54pm_84c93628-168a-40b8-a093-7a72ec42c786.png?v=1712894444',
            ],
        ],
        591 => [
            'name'       => 'ARDEX Buff Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-se-silicone-buff',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.01.42pm_d778862f-66f3-442c-9156-403915244008.png?v=1712891883',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.54.54pm_d84bb2ec-0551-4671-86b1-1d78ca34b648.png?v=1712894147',
            ],
        ],
        592 => [
            'name'       => 'ARDEX Grout Booster',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-grout-booster-4l',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-08at11.14.00am.png?v=1712538877',
            ],
        ],
        593 => [
            'name'       => 'ARDEX FG8 Grout 20KG Misty Grey',
            'ntiled_url' => 'https://ntiled.com.au/products/copy-of-ardex-fg8-grout-241-misty-grey',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_16289448-20ae-4e64-a6da-93dabf1fd590.png?v=1708484302',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at1.59.14pm.png?v=1708484389',
            ],
        ],
        594 => [
            'name'       => 'ARDEX FG8 Grout 20KG Light Beige',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-249-light-beige',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_2a5e9aa1-dcb2-466d-8144-1adfccc16b10.png?v=1708481639',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at1.14.06pm.png?v=1708481656',
            ],
        ],
        595 => [
            'name'       => 'ARDEX FG8 Grout 5KG Magellan Grey',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fsdd-grout-5kg-373-magellan-grey',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_3.12.38_pm.png?v=1745471818',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_2.40.17_pm.png?v=1745471818',
            ],
        ],
        596 => [
            'name'       => 'ARDEX FSDD Grout 5KG Slate Grey',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fsdd-grout-5kg-311-slate-grey',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_3.12.38_pm.png?v=1745471818',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_2.40.17_pm.png?v=1745471818',
            ],
        ],
        597 => [
            'name'       => 'ARDEX FG8 Grout 5KG Light Beige',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-249-light-beige',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_ddee1940-6334-4ee7-ad00-d8602f041a50.png?v=1713148735',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.38.10pm.png?v=1713148736',
            ],
        ],
        598 => [
            'name'       => 'ARDEX FG8 Grout 5KG Havana',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-280-havana',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_c66e425f-41b8-434c-b433-36cffac592d3.png?v=1713148153',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.28.25pm.png?v=1713148153',
            ],
        ],
        599 => [
            'name'       => 'ARDEX FG8 Grout 5KG Mocha',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-210-mocha',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_54d62bb8-4398-4d34-8b24-bcee8dae0176.png?v=1713147370',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.15.45pm.png?v=1713147370',
            ],
        ],
        // --- ARDEX grouts, silicones & mastic adhesive (doc 14) ---
        600 => [
            'name'       => 'ARDEX FG8 Grout 5kg Pewter Blue',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-252-pewter-blue',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm.png?v=1713147265',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.11.15pm.png?v=1713147266',
            ],
        ],
        601 => [
            'name'       => 'ARDEX SE Todd River Sand Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-se-silicone-todd-river-sand',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.01.42pm_b91ea4d5-0d61-419e-b4e4-7ae01140c060.png?v=1712892238',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.54.54pm_e6158f9f-9e49-4668-aa32-97ab5d1624e5.png?v=1712894481',
            ],
        ],
        602 => [
            'name'       => 'ARDEX SE Alabaster Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/copy-of-ardex-se-silicone-alabaster',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.01.42pm_2a7e155f-bc8a-4124-8f7f-eb1ebc099d2c.png?v=1712892024',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.54.54pm.png?v=1712894117',
            ],
        ],
        603 => [
            'name'       => 'ARDEX FG8 Grout 20kg Charred Ash',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-287-charred-ash',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_d0c365c3-1d86-4306-b3e2-194971b82215.png?v=1708484695',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at2.05.22pm.png?v=1708484762',
            ],
        ],
        604 => [
            'name'       => 'ARDEX FG8 Grout 20kg Mocha',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-210-mocha',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_d139b679-12a3-4abd-b704-ac7434f9437f.png?v=1708482638',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at1.30.50pm.png?v=1708482660',
            ],
        ],
        605 => [
            'name'       => 'ARDEX FG8 Grout 20kg Sandalwood',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-216-sandalwood',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_b0d55e2b-f07f-4adc-86eb-1aab5309885e.png?v=1708482482',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at1.28.16pm.png?v=1708482506',
            ],
        ],
        606 => [
            'name'       => 'ARDEX FG8 Grout 20kg French Vanilla',
            'ntiled_url' => 'https://ntiled.com.au/products/copy-of-copy-of-ardex-fg8-grout-250-french-vanilla',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_f0ef1a2c-91aa-46b1-9768-89dba4ecdacc.png?v=1708480953',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at1.02.53pm.png?v=1708480994',
            ],
        ],
        // ARDEX FSDD (607-613): NTiled uses the same 2 shared color-chart images for the whole 5kg range.
        607 => [
            'name'       => 'ARDEX FSDD Grout 5kg Charred Ash',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fsdd-grout-5kg-387-charred-ash',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_3.12.38_pm.png?v=1745471818',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_2.40.17_pm.png?v=1745471818',
            ],
        ],
        608 => [
            'name'       => 'ARDEX FSDD Grout 5kg Havana',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fsdd-grout-5kg-380-havana',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_3.12.38_pm.png?v=1745471818',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_2.40.17_pm.png?v=1745471818',
            ],
        ],
        609 => [
            'name'       => 'ARDEX FSDD Grout 5kg Buff',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fsdd-grout-5kg-329-buff',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_3.12.38_pm.png?v=1745471818',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_2.40.17_pm.png?v=1745471818',
            ],
        ],
        610 => [
            'name'       => 'ARDEX FSDD Grout 5kg Alabaster',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fsdd-grout-5kg-382-alabaster',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_3.12.38_pm.png?v=1745471818',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_2.40.17_pm.png?v=1745471818',
            ],
        ],
        611 => [
            'name'       => 'ARDEX FSDD Grout 5kg Olive',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fsdd-grout-5kg-395-olive',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_3.12.38_pm.png?v=1745471818',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_2.40.17_pm.png?v=1745471818',
            ],
        ],
        612 => [
            'name'       => 'ARDEX FSDD Grout 5kg Travertine',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fsdd-grout-5kg-377-travertine',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_3.12.38_pm.png?v=1745471818',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_2.40.17_pm.png?v=1745471818',
            ],
        ],
        613 => [
            'name'       => 'ARDEX FSDD Grout 5kg Ultra White',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fsdd-grout-5kg-390-ultra-white',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_3.12.38_pm.png?v=1745471818',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/Screen_Shot_2025-04-24_at_2.40.17_pm.png?v=1745471818',
            ],
        ],
        614 => [
            'name'       => 'ARDEX D2 22kg Mastic Tile Adhesive',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-d2-22kg-mastic-tile-adhesive',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ardexd2.jpg?v=1725241386',
            ],
        ],
        615 => [
            'name'       => 'ARDEX FG8 Grout 5kg White',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-200-white',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_043b3344-8a76-42b4-b33b-b487cc9c9494.png?v=1713149491',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.49.53pm.png?v=1713149491',
            ],
        ],
        616 => [
            'name'       => 'ARDEX FG8 Grout 5kg Alabaster',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-282-alabaster',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_b450d019-072c-4a50-9761-0d0f50d17e22.png?v=1713149372',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.48.47pm.png?v=1713149372',
            ],
        ],
        617 => [
            'name'       => 'ARDEX FG8 Grout 5kg French Vanilla',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-250-french-vanilla',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_448bbdee-725a-44e9-bad0-41b0bd78cbf2.png?v=1713149304',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.47.40pm.png?v=1713149304',
            ],
        ],
        618 => [
            'name'       => 'ARDEX FG8 Grout 5kg Charred Ash',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-287-charred-ash',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_6c3d0718-8b81-4327-a9f3-6dcfbd99576a.png?v=1713149214',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.46.02pm.png?v=1713149214',
            ],
        ],
        619 => [
            'name'       => 'ARDEX FG8 Grout 5kg Midnight',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-202-midnight',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_5220ec47-bfde-4d1d-a5fc-c003d84ffe91.png?v=1713149133',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.43.35pm.png?v=1713149133',
            ],
        ],
        620 => [
            'name'       => 'ARDEX FG8 Grout 5kg Macchiato',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-288-macchiato',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_afa1ef69-a556-4f5f-94a2-984b5fe94838.png?v=1713148980',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.42.11pm.png?v=1713148980',
            ],
        ],
        621 => [
            'name'       => 'ARDEX FG8 Grout 5kg Buff',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-229-buff',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_a326b055-14ae-4d19-beeb-e353cb83504f.png?v=1713148899',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.39.41pm.png?v=1713148899',
            ],
        ],
        622 => [
            'name'       => 'ARDEX FG8 Grout 5kg Walnut',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-248-walnut',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_6bede96b-e33e-4edd-9454-44691b6c0a65.png?v=1713148658',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.36.49pm.png?v=1713148657',
            ],
        ],
        // --- ARDEX extras: 5kg extras, silicones, primers, grout booster & 20kg range (doc 15) ---
        623 => [
            'name'       => 'ARDEX FG8 Grout 5kg Slate Grey',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-211-slate-grey',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_e352eeef-6f2e-4aa8-8b1e-d806448a4e18.png?v=1713148592',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.35.37pm.png?v=1713148592',
            ],
        ],
        624 => [
            'name'       => 'ARDEX FG8 Grout 5kg Magellan Grey',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-273-magellan-grey',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_5dc9c552-65bc-42ba-9b9b-bab88e529cdb.png?v=1713148488',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.33.54pm.png?v=1713148488',
            ],
        ],
        625 => [
            'name'       => 'ARDEX FG8 Grout 5kg Travertine',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-277-travertine',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_4bc08855-3a40-4886-b8bf-3857b97354b3.png?v=1713148074',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.25.17pm.png?v=1713148074',
            ],
        ],
        626 => [
            'name'       => 'ARDEX FG8 Grout 5kg Sandalwood',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-5kg-216-sandalwood',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.02.41pm_81d19ac9-43cc-4727-9198-86b9e41ac65d.png?v=1713147625',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-15at12.20.33pm.png?v=1713147645',
            ],
        ],
        627 => [
            'name'       => 'ARDEX SE Olive Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-se-silicone-olive',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.01.42pm_69f76bd0-61e4-4f92-b70d-9b331341c616.png?v=1712892718',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.54.54pm_eb2af749-6e34-474e-a2ea-48a479b68ca1.png?v=1712894383',
            ],
        ],
        628 => [
            'name'       => 'ARDEX SE Midnight Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-se-silicone-midnight',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.01.42pm_b1add474-af9c-49f6-b2b9-998e2ad4b525.png?v=1712892464',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.54.54pm_3620a444-3071-4a55-b8f4-1dab5220c8df.png?v=1712894302',
            ],
        ],
        629 => [
            'name'       => 'ARDEX SE Ultrawhite Silicone',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-se-silicone-ultrawhite',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.01.42pm_c70f046d-0577-4477-974b-d5edf23728bf.png?v=1712892059',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-12at1.54.54pm_f985175f-0be5-4669-a1e4-39cd3644b239.png?v=1712894522',
            ],
        ],
        630 => [
            'name'       => 'Ardex Multiprime 1L',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-multiprime-1l',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-08at11.11.07am_95c33fd0-6601-4650-bb1f-f91fedb32407.png?v=1712539077',
            ],
        ],
        631 => [
            'name'       => 'Ardex Multiprime 4L',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-multiprime-4l',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-08at11.11.07am.png?v=1712538693',
            ],
        ],
        632 => [
            'name'       => 'Ardex Grout Booster 1L',
            'ntiled_url' => 'https://ntiled.com.au/products/copy-of-ardex-grout-booster-1l',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-04-08at11.00.38am.png?v=1712538057',
            ],
        ],
        633 => [
            'name'       => 'ARDEX FG8 Grout 20kg Midnight',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-202-midnight',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_31a9b1ed-ecca-459f-bc6b-be5fc3f06c49.png?v=1708484953',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at2.09.34pm.png?v=1708484985',
            ],
        ],
        634 => [
            'name'       => 'ARDEX FG8 Grout 20kg Pewter Blue',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-252-pewter-blue',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_493952f1-6827-4d07-8ae2-0669f617c6a0.png?v=1708484865',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at2.08.04pm.png?v=1708484894',
            ],
        ],
        635 => [
            'name'       => 'ARDEX FG8 Grout 20kg Slate Grey',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-211-slate-grey',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_5f5b007c-5d4f-48ea-863b-1395cb3fe020.png?v=1708484592',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at2.03.31pm.png?v=1708484621',
            ],
        ],
        636 => [
            'name'       => 'ARDEX FG8 Grout 20kg Magellan Grey',
            'ntiled_url' => 'https://ntiled.com.au/products/copy-of-ardex-fg8-grout-273-magellan-grey',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_d5a43652-a078-4834-ab40-38b2124e6925.png?v=1708484492',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at2.01.46pm.png?v=1708484525',
            ],
        ],
        637 => [
            'name'       => 'ARDEX FG8 Grout 20kg Macchiato',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-288-macchiato',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_76d85762-7be1-4f0b-a31b-ead551b83e31.png?v=1708483404',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at1.44.38pm.png?v=1708483525',
            ],
        ],
        638 => [
            'name'       => 'ARDEX FG8 Grout 20kg Olive',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-295-olive',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_241cca48-eb30-4da3-bfea-4d5a782c913f.png?v=1708482909',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at1.36.25pm.png?v=1708483040',
            ],
        ],
        639 => [
            'name'       => 'ARDEX FG8 Grout 20kg Havana',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-280-havana',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_c7762321-5f4f-4b09-bb0b-7ed99106d89e.png?v=1708482804',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at1.33.36pm.png?v=1708482826',
            ],
        ],
        640 => [
            'name'       => 'ARDEX FG8 Grout 20kg Todd River Sand',
            'ntiled_url' => 'https://ntiled.com.au/products/copy-of-ardex-fg8-grout-227-todd-river-sand',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_8d29cf41-1d79-4a77-913c-b443ae1cf7ce.png?v=1708482276',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at1.24.11pm.png?v=1708482282',
            ],
        ],
        641 => [
            'name'       => 'ARDEX FG8 Grout 20kg Mudberry',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-285-mudberry',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_779e001d-c132-4d52-a2c1-d0d931b5a3c6.png?v=1708482056',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at1.21.20pm.png?v=1708482090',
            ],
        ],
        642 => [
            'name'       => 'ARDEX FG8 Grout 20kg Alabaster',
            'ntiled_url' => 'https://ntiled.com.au/products/copy-of-ardex-fg8-grout-282-alabaster',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm_3af995ad-abca-4fa7-ae21-fe4a78e099be.png?v=1708480674',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.59.51pm.png?v=1708480879',
            ],
        ],
        643 => [
            'name'       => 'ARDEX FG8 Grout 20kg White',
            'ntiled_url' => 'https://ntiled.com.au/products/ardex-fg8-grout-200-white',
            'images'     => [
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.36.56pm.png?v=1708480133',
                'https://cdn.shopify.com/s/files/1/0463/9267/2415/files/ScreenShot2024-02-21at12.55.35pm.png?v=1708480546',
            ],
        ],
    ];

    private array $report = [];

    public function handle(): int
    {
        $dryRun    = (bool) $this->option('dry-run');
        $onlyId    = $this->option('product') ? (int) $this->option('product') : null;
        $mode      = $dryRun ? '[DRY RUN] ' : '';

        $this->info("{$mode}Importing NTiled product images...");
        $this->newLine();

        foreach ($this->map as $productId => $entry) {
            if ($onlyId !== null && $onlyId !== $productId) {
                continue;
            }

            $product = Product::find($productId);

            if (!$product) {
                $this->line("  <error>MISS</error>  #{$productId} {$entry['name']} — product not found in DB");
                $this->report[] = ['product' => $entry['name'], 'ntiled_url' => $entry['ntiled_url'], 'added' => 0, 'skipped' => 0, 'error' => 'Product not found'];
                continue;
            }

            $added   = 0;
            $skipped = 0;
            $errors  = [];

            foreach ($entry['images'] as $imageUrl) {
                if ($dryRun) {
                    $this->line("  <comment>PREVIEW</comment> #{$productId} {$product->name} ← {$imageUrl}");
                    $added++;
                    continue;
                }

                $filename = pathinfo(parse_url($imageUrl, PHP_URL_PATH), PATHINFO_BASENAME);

                // Skip if this source URL was already imported (tracked via alt_key)
                $sourceKey = 'ntiled:' . strtok($imageUrl, '?');
                $alreadyExists = ProductMedia::where('product_id', $productId)
                    ->where('type', 'image')
                    ->where('alt_key', $sourceKey)
                    ->exists();

                if ($alreadyExists) {
                    $this->line("  <comment>SKIP</comment>  #{$productId} {$product->name} — already imported");
                    $skipped++;
                    continue;
                }

                try {
                    $response = Http::timeout(30)->get($imageUrl);

                    if (!$response->successful()) {
                        throw new \RuntimeException("HTTP {$response->status()} fetching {$imageUrl}");
                    }

                    $imageData = $response->body();
                    $mime      = $response->header('Content-Type') ?: 'image/jpeg';
                    $mime      = strtok($mime, ';'); // strip charset

                    $ext       = match (true) {
                        str_contains($mime, 'png')  => 'png',
                        str_contains($mime, 'webp') => 'webp',
                        str_contains($mime, 'gif')  => 'gif',
                        default                     => 'jpg',
                    };

                    $directory = "products/{$productId}/images";
                    $storedName = Str::uuid() . '.' . $ext;
                    $path = "{$directory}/{$storedName}";

                    Storage::disk('public')->put($path, $imageData);

                    // Get image dimensions
                    $tmpFile = tempnam(sys_get_temp_dir(), 'ntd_img_');
                    file_put_contents($tmpFile, $imageData);
                    $dims    = @getimagesize($tmpFile);
                    @unlink($tmpFile);

                    $isPrimary = !ProductMedia::where('product_id', $productId)
                        ->where('type', 'image')
                        ->where('is_primary', true)
                        ->exists();

                    $nextSort = (int) ProductMedia::where('product_id', $productId)
                        ->where('type', 'image')
                        ->max('sort') + 1;

                    ProductMedia::create([
                        'product_id'     => $productId,
                        'type'           => 'image',
                        'path'           => $path,
                        'mime'           => $mime,
                        'file_size_bytes'=> strlen($imageData),
                        'width'          => $dims ? $dims[0] : null,
                        'height'         => $dims ? $dims[1] : null,
                        'alt_key'        => $sourceKey,
                        'sort'           => $nextSort,
                        'is_primary'     => $isPrimary,
                    ]);

                    // Keep products.image_url in sync so shop listing shows the thumbnail
                    if ($isPrimary && empty($product->image_url)) {
                        $product->update(['image_url' => '/storage/' . $path]);
                    }

                    $this->line("  <info>ADDED</info>  #{$productId} {$product->name} — {$storedName} ({$mime})");
                    $added++;

                } catch (\Throwable $e) {
                    $this->line("  <error>FAIL</error>   #{$productId} {$product->name} — {$imageUrl}: " . $e->getMessage());
                    $errors[] = $e->getMessage();
                }
            }

            $this->report[] = [
                'product'    => $product->name,
                'ntiled_url' => $entry['ntiled_url'],
                'added'      => $added,
                'skipped'    => $skipped,
                'error'      => implode('; ', $errors) ?: null,
            ];
        }

        $this->newLine();
        $this->info('Done.');
        $this->newLine();

        $this->table(
            ['Product', 'NTiled URL', 'Added', 'Skipped', 'Error'],
            array_map(fn($r) => [
                $r['product'],
                $r['ntiled_url'],
                $r['added'],
                $r['skipped'],
                $r['error'] ?? '—',
            ], $this->report)
        );

        return self::SUCCESS;
    }
}
