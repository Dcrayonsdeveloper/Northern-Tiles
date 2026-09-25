# Deploy log

Every entry below is written by `ship.sh` when something goes to production.
It records what changed, who shipped it, the commit on GitHub, the commit the
server moved from and to, migrations applied, and the smoke-test results.

Started 23 Sep 2026, after two agents deploying hand-picked files onto the same
live folder left the server running half of each branch — one agent's routes
file overwritten, the other's controller never uploaded — with no record of
what was actually live.

**To ship:** `./ship.sh "what you changed"`

## 2026-09-23 08:18 UTC — `577e8f3`

**Add multi-image support for Visualizer room scenes**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (577e8f3)
- Server: e2be798 → 577e8f3
- Migrations: 2026_09_23_000002_create_visualizer_room_images_table ......... 67.08ms DONE
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   .../Controllers/Admin/VisualizerController.php     | 117 ++++++++++++---
   app/Domain/Catalog/Models/VisualizerRoom.php       |  35 +++++
   app/Domain/Catalog/Models/VisualizerRoomImage.php  |  53 +++++++
   .../Storefront/VisualizerController.php            |  18 ++-
   ..._000002_create_visualizer_room_images_table.php |  27 ++++
   resources/js/Pages/Admin/Visualizer/Create.jsx     |  91 ++++++++----
   resources/js/Pages/Admin/Visualizer/Edit.jsx       | 157 ++++++++++++++++-----
   resources/js/Pages/Storefront/Visualizer.jsx       |  49 ++++++-
   routes/admin.php                                   |   1 +
   9 files changed, 462 insertions(+), 86 deletions(-)
```

## 2026-09-23 08:29 UTC — `072d8b2`

**Fix: Ensure featured products from visualizer rooms are always loaded even when >500 products exist**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (072d8b2)
- Server: 577e8f3 → 072d8b2
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   .../Storefront/VisualizerController.php            | 59 +++++++++++++++++-----
   1 file changed, 46 insertions(+), 13 deletions(-)
```

## 2026-09-23 09:22 UTC — `d67790a`

**Add category tabs to Users admin page: All Users, Admins, Builders/Trade, Regular Users with summary cards**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (d67790a)
- Server: 072d8b2 → d67790a
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   resources/js/Pages/Admin/Users/Index.jsx | 295 ++++++++++++++++++++++---------
   1 file changed, 212 insertions(+), 83 deletions(-)
```

## 2026-09-23 09:34 UTC — `d23ed28`

**Show content preview on blog listing: add content accessor to Post model, update BlogPostCard to show content when no excerpt**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (d23ed28)
- Server: d67790a → d23ed28
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   app/Domain/CMS/Models/Post.php               | 39 +++++++++++++++++++++++++++-
   resources/js/Components/CMS/BlogPostCard.jsx | 24 ++++++++++++-----
   2 files changed, 56 insertions(+), 7 deletions(-)
```

## 2026-09-23 09:40 UTC — `6ee8b7b`

**Update Featured Collections on homepage: add specific category links for each collection card**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (6ee8b7b)
- Server: d23ed28 → 6ee8b7b
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   resources/js/Pages/Storefront/Home.jsx | 14 +++++++-------
   1 file changed, 7 insertions(+), 7 deletions(-)
```

## 2026-09-23 10:00 UTC — `2e4f187`

**Add role selection to User Create/Edit pages - replace Admin checkbox with role dropdown (Create) and role checkboxes (Edit), show role badges in Users list**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (2e4f187)
- Server: 6ee8b7b → 2e4f187
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   app/Http/Controllers/Admin/UserController.php | 50 ++++++++++++++++++-----
   resources/js/Pages/Admin/Users/Create.jsx     | 36 ++++++++++-------
   resources/js/Pages/Admin/Users/Edit.jsx       | 57 ++++++++++++++++++++-------
   resources/js/Pages/Admin/Users/Index.jsx      | 31 +++++++++++++--
   4 files changed, 131 insertions(+), 43 deletions(-)
```

## 2026-09-23 10:03 UTC — `4c56e8d`

**Fix dictionary helper to properly use fallback text when translation key not found**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (4c56e8d)
- Server: 2e4f187 → 4c56e8d
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   resources/js/Support/dictionary.js | 19 ++++++++++++++++++-
   1 file changed, 18 insertions(+), 1 deletion(-)
```

## 2026-09-23 10:09 UTC — `8444393`

**Fix cart and checkout to show proper quantity labels - products sold per unit (bags, pieces) now show 'Qty: X' instead of 'X m²'**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (8444393)
- Server: 4c56e8d → 8444393
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   app/Domain/Cart/Services/CheckoutService.php     |  7 +++-
   app/Http/Controllers/Api/CartController.php      | 12 +++++-
   resources/js/Components/Cart/CartLineItem.jsx    | 48 ++++++++++++++++++++----
   resources/js/Pages/Builder/Checkout/Index.jsx    |  6 ++-
   resources/js/Pages/Storefront/Checkout/Index.jsx |  6 ++-
   5 files changed, 67 insertions(+), 12 deletions(-)
```

## 2026-09-23 10:59 UTC — `aae2d3e`

**Add video demo to phone mockup in Tile Visualizer section on homepage**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (aae2d3e)
- Server: 8444393 → aae2d3e
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   public/images/visualizerimg/visualizer-demo.mp4 | Bin 0 -> 3121219 bytes
   resources/js/Pages/Storefront/Home.jsx          |  13 ++++++++++---
   2 files changed, 10 insertions(+), 3 deletions(-)
```

## 2026-09-23 11:04 UTC — `4f76bf9`

**Add poster image for video loading state in phone mockup**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (4f76bf9)
- Server: aae2d3e → 4f76bf9
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   resources/js/Pages/Storefront/Home.jsx | 6 +++++-
   1 file changed, 5 insertions(+), 1 deletion(-)
```

## 2026-09-23 11:06 UTC — `3281866`

**Remove white padding inside phone mockup - video now fills entire screen**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (3281866)
- Server: 4f76bf9 → 3281866
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   resources/js/Pages/Storefront/Home.jsx | 4 ++--
   1 file changed, 2 insertions(+), 2 deletions(-)
```

## 2026-09-23 11:32 UTC — `ddf173b`

**Add Print Receipt button to order details page with printable receipt view**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (ddf173b)
- Server: 3281866 → ddf173b
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   app/Http/Controllers/Admin/OrderController.php |  15 ++
   resources/js/Pages/Admin/Orders/Show.jsx       |  14 +-
   resources/views/admin/orders/receipt.blade.php | 327 +++++++++++++++++++++++++
   routes/web.php                                 |   1 +
   4 files changed, 356 insertions(+), 1 deletion(-)
```

## 2026-09-25 06:40 UTC — `778aba3`

**Remove large Trustpilot reviews section from product page, keep only small button**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (778aba3)
- Server: ddf173b → 778aba3
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   resources/js/Pages/Storefront/Shop/Show.jsx | 18 ++----------------
   1 file changed, 2 insertions(+), 16 deletions(-)
```

## 2026-09-25 06:53 UTC — `6f38749`

**Add rich product detail page to builder panel with separate trade cart**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (6f38749)
- Server: 778aba3 → 6f38749
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   .../Controllers/Builder/BuilderShopController.php  |   15 +-
   resources/js/Pages/Builder/Shop/Show.jsx           | 1101 ++++++++++++++------
   2 files changed, 785 insertions(+), 331 deletions(-)
```

## 2026-09-25 08:00 UTC — `3e118e3`

**Convert builder portal hamburger menu to slide-in sidebar**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (3e118e3)
- Server: 6f38749 → 3e118e3
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   resources/js/Components/Builder/BuilderHeader.jsx | 184 ++++++++++++++++------
   1 file changed, 132 insertions(+), 52 deletions(-)
```

## 2026-09-25 08:07 UTC — `a644587`

**Remove Email Templates from admin panel navigation**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (a644587)
- Server: 3e118e3 → a644587
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   resources/js/Components/Admin/GlobalSearch.jsx    | 1 -
   resources/js/Layouts/DashboardLayout.jsx          | 7 -------
   resources/js/Pages/Admin/AbandonedCarts/Index.jsx | 5 -----
   3 files changed, 13 deletions(-)
```

## 2026-09-25 08:11 UTC — `075f12f`

**Remove Email Messages section from Abandoned Cart details page**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (075f12f)
- Server: a644587 → 075f12f
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   resources/js/Pages/Admin/AbandonedCarts/Show.jsx | 70 +-----------------------
   1 file changed, 1 insertion(+), 69 deletions(-)
```

## 2026-09-25 09:27 UTC — `3cee626`

**Builder Trade Catalogue: Replace sidebar categories with collapsible filters panel**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (3cee626)
- Server: 075f12f → 3cee626
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   resources/js/Pages/Builder/Shop/Index.jsx | 301 +++++++++++++++++-------------
   1 file changed, 175 insertions(+), 126 deletions(-)
```
