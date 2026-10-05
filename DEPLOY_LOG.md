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

## 2026-09-25 09:44 UTC — `e1c74c5`

**Builder cart upsells: Only show products assigned to builder account**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (e1c74c5)
- Server: 3cee626 → e1c74c5
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   app/Domain/Cart/Services/UpsellService.php | 161 +++++++++++++++++++++++------
   1 file changed, 130 insertions(+), 31 deletions(-)
```

## 2026-09-29 10:44 UTC — `4788a4e`

**Checkout: Australian address fields and delivery priced by postcode

Replaces the free-text City and State boxes with a single State/Territory
dropdown, and states the country instead of asking for it — deliveries are
Australian only, and the server enforces both rather than trusting the form.
The suburb is carried by the postcode, so City is no longer collected.

Removes the Standard/Express picker. Delivery is now priced by destination:
$10 metropolitan Sydney, $10 metropolitan Melbourne, $20 rest of Australia,
with a note pointing anything unusual at the sales team. The rate card lives in
PricingService and is passed to the page, so the figure quoted on screen is the
one the order is charged at. Rates are settings, changeable without a deploy.

The trade checkout extends the retail controller, so it shares this validation
and these props and gets the same treatment — left alone it would have rejected
every trade order on the new country rule.**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (4788a4e)
- Server: e1c74c5 → 4788a4e
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   app/Domain/Cart/Services/CheckoutService.php       |  56 ++++-----
   app/Domain/Cart/Services/PricingService.php        |  93 +++++++++++---
   .../Controllers/Storefront/CheckoutController.php  |   3 +-
   resources/js/Pages/Admin/Orders/Show.jsx           |   4 +-
   resources/js/Pages/Builder/Checkout/Index.jsx      | 108 +++++-----------
   resources/js/Pages/Storefront/Checkout/Index.jsx   | 139 ++++++++-------------
   resources/js/Utils/australiaStates.js              |  21 ++++
   7 files changed, 214 insertions(+), 210 deletions(-)
```

## 2026-09-29 11:00 UTC — `b1cce2d`

**Checkout: single PayPal online payment, delivery note by the address, state-aware rates

Replaces Cash on Delivery / UPI / Credit-Debit Card with one Pay Online option
carrying the PayPal wordmark. UPI and COD were never options this business
offers, and a radio list of one is a question with no answer, so it is stated
rather than asked. The logo is served from public/images/payment/ rather than
hotlinked.

Moves the sales-team line out of the Order Summary and under the shipping
address, where it now also spells out the three rates -- it belongs where the
customer is choosing where the order goes, not beside the total.

The delivery zone now also reads the state, so picking one moves the price
before a postcode has been typed. The postcode still decides it whenever there
is one: a NSW order to Gosford is not metropolitan Sydney, and charging it as
though it were would lose money on every regional delivery.**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (b1cce2d)
- Server: 4788a4e → b1cce2d
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   app/Domain/Cart/Services/CheckoutService.php     | 27 +++-----
   app/Domain/Cart/Services/PricingService.php      | 36 +++++++---
   public/images/payment/paypal.svg                 | 55 ++++++++++++++++
   resources/js/Pages/Builder/Checkout/Index.jsx    | 81 ++++++++---------------
   resources/js/Pages/Storefront/Checkout/Index.jsx | 84 ++++++++----------------
   5 files changed, 145 insertions(+), 138 deletions(-)
```

## 2026-09-29 11:02 UTC — `9083d67`

**ship.sh: carry public/images in the deploy package

The PayPal logo was committed, pushed and deployed, and still 404'd on the
site: the package listed public/build but not public/images, so an image added
alongside the code that references it never reached the server. Adding it also
moved 6MB of images that had only ever existed on the local machine.

This is the failure ship.sh exists to prevent -- a deploy that reports success
while the server holds only part of the change -- so the package now covers the
directory rather than relying on someone remembering to upload it by hand.**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (9083d67)
- Server: b1cce2d → 9083d67
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   ship.sh | 4 ++--
   1 file changed, 2 insertions(+), 2 deletions(-)
```

## 2026-09-29 11:25 UTC — `42a2eed`

**Checkout: City dropdown that follows the chosen state

Sydney and Melbourne are cities, so they could never appear in a state
dropdown, which left the rate card naming places the form had no way to
express. Each state now carries its own city list -- capital first, ending in
an Other catch-all -- and the city box fills from whichever state is chosen.
Changing the state clears the city, so a Victorian address cannot keep Sydney
selected underneath it.

The city also narrows the delivery zone, sitting between the postcode and the
state: the postcode still decides whenever there is one, because Gosford is New
South Wales but is not metropolitan Sydney. City is collected and required
again, but as a list rather than the free-text box that used to produce four
spellings of the same suburb.**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (42a2eed)
- Server: 9083d67 → 42a2eed
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   app/Domain/Cart/Services/CheckoutService.php     | 11 +++--
   app/Domain/Cart/Services/PricingService.php      | 36 +++++++++-----
   resources/js/Pages/Builder/Checkout/Index.jsx    | 45 ++++++++++++++---
   resources/js/Pages/Storefront/Checkout/Index.jsx | 45 ++++++++++++++---
   resources/js/Utils/australiaStates.js            | 62 +++++++++++++++++++-----
   5 files changed, 160 insertions(+), 39 deletions(-)
```

## 2026-09-29 11:28 UTC — `e0ec89e`

**Checkout: a chosen city settles the delivery zone

Picking Newcastle or Bendigo was being charged metropolitan rates. The city was
looked up against the metro lists and, finding no match, fell through to the
state -- where NSW means Sydney and VIC means Melbourne -- so every regional
city in those two states quoted $10 instead of $20.

Choosing a city is a statement about where the order is going, so it now ends
the search: matched means that zone, unmatched means Rest of Australia. The
state is consulted only when no city has been chosen yet, and the postcode
still overrides both.**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (e0ec89e)
- Server: 42a2eed → e0ec89e
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   app/Domain/Cart/Services/PricingService.php      | 5 +++++
   resources/js/Pages/Builder/Checkout/Index.jsx    | 7 +++++--
   resources/js/Pages/Storefront/Checkout/Index.jsx | 7 +++++--
   3 files changed, 15 insertions(+), 4 deletions(-)
```

## 2026-09-29 12:39 UTC — `81923d2`

**Checkout: the city the customer picked decides the delivery zone

Selecting Geelong with postcode 3074 quoted $10 metropolitan Melbourne. 3074 is
Thomastown, inside the Melbourne metro range, and the postcode was ranked above
the city -- so a mistyped or half-remembered postcode silently overrode a city
the customer had deliberately chosen from a list.

The city is now what counts: it is picked from a fixed list, it says plainly
where the order is going, and a postcode that disagrees with it is far more
likely to be a typo than a correction. Postcode and state are still consulted
when no city has been chosen, which is how API orders and older saved addresses
keep getting priced. The hint under the total now asks for a city rather than a
postcode, since that is what confirms the rate.**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (81923d2)
- Server: e0ec89e → 81923d2
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   app/Domain/Cart/Services/PricingService.php      | 35 ++++++++++++------------
   resources/js/Pages/Builder/Checkout/Index.jsx    | 21 ++++++--------
   resources/js/Pages/Storefront/Checkout/Index.jsx | 23 +++++++---------
   3 files changed, 37 insertions(+), 42 deletions(-)
```

## 2026-09-30 06:14 UTC — `3aa8675`

**Admin: choose product images while creating the product

The create page said 'Save the product first to upload media', so adding a
product meant filling the form, saving, waiting for the redirect, then going
back for the images. Media needed a product row to attach to, and on the create
page there was not one yet.

The files now ride along with the form and are stored server-side the moment the
product exists, which is the first point at which they can be. Previews are
object URLs revoked when the selection changes, so a long editing session does
not hold every file it ever displayed, and the first image is marked as the main
one.

The selection is held to 20 files and 36MB because that is what the server
accepts (32MB per file and a 40MB request in 99-ntiled.ini, nginx at 40MB), and
says so in a sentence rather than letting nginx answer with a bare 413. The
validation rule was written at 100MB per file, which PHP would have dropped
before validation ever saw it.**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (3aa8675)
- Server: 81923d2 → 3aa8675
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   .../Catalog/Http/Requests/StoreProductRequest.php  |   8 ++
   app/Http/Controllers/Admin/ProductController.php   |  18 +++-
   resources/js/Pages/Admin/Products/Create.jsx       | 120 +++++++++++++++++++--
   3 files changed, 131 insertions(+), 15 deletions(-)
```

## 2026-09-30 06:19 UTC — `22ab961`

**Admin: product uploads use the live session token, not the page-load one

Uploading an image failed with 419. The csrf-token meta tag is written into the
HTML once, when the page renders, so an admin tab left open past the two-hour
session lifetime carries a token the server has already retired -- the page
still looks signed in, and every upload is rejected.

The XSRF-TOKEN cookie is refreshed on every response, so requests now carry
that. Laravel reads X-CSRF-TOKEN first and only falls back to X-XSRF-TOKEN when
it is absent, so exactly one header is sent, cookie preferred; sending both
would let the stale tag beat the fresh cookie. All six fetch calls on the
product editor move across, autosave and variant updates included -- those were
failing the same way, silently.

A 419 now says the session expired and to refresh, rather than printing the
number. The uploader also advertised 100MB when the server accepts 32MB.**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (22ab961)
- Server: 3aa8675 → 22ab961
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   resources/js/Pages/Admin/Products/Edit.jsx | 41 +++++++++++++++---------------
   resources/js/Utils/csrf.js                 | 37 +++++++++++++++++++++++++++
   2 files changed, 57 insertions(+), 21 deletions(-)
```

## 2026-09-30 09:48 UTC — `24361d4`

**Admin: product list falls back to uploaded media for its thumbnail

The list read the image_url column alone, so the nine products whose photos were
uploaded through the media uploader -- which writes rows to product_media and
leaves that column empty -- showed a placeholder while the 1,167 imported ones
showed a picture. The files were on disk and flagged primary the whole time.

A thumbnail_url accessor now prefers the uploaded image and falls back to the
column. It reads the relation the list already eager-loads rather than querying,
so twenty rows stay one query instead of forty, and it skips media whose file is
missing so a dead row shows the placeholder rather than a broken image.

The eager load no longer filters to is_primary only: a product whose images were
uploaded without one being flagged has a thumbnail to show as well. The accessor
is appended in the controller rather than on the model, so only the screen that
needs it pays for resolving one.**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (24361d4)
- Server: 22ab961 → 24361d4
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   app/Domain/Catalog/Services/ProductService.php   |  7 +++++-
   app/Http/Controllers/Admin/ProductController.php |  4 ++++
   app/Models/Product.php                           | 28 ++++++++++++++++++++++++
   resources/js/Pages/Admin/Products/Index.jsx      |  4 ++--
   4 files changed, 40 insertions(+), 3 deletions(-)
```

## 2026-09-30 11:33 UTC — `eff8b54`

**Storefront: products show their uploaded image everywhere, not just where a column was imported

Search, the shop grid, product cards, the cart and the home page all read the
image_url column. Imported products have a URL there; products photographed
through the admin uploader do not -- their files live in product_media and the
column stays empty -- so every newly added product showed a placeholder across
the whole site while the picture sat on disk.

An empty column now falls back to the uploaded image, which fixes every one of
those surfaces at once rather than a dozen call sites one at a time. Only
products missing a column value pay for the lookup, and a loaded media relation
is used in preference to querying; search and the catalogue listing now load
media alongside their results so the fallback costs no extra queries. Media
whose file is missing is skipped, so a dead row shows the placeholder instead of
a broken image.

Safe to resolve at the model: image_url is import data, not an admin field --
nothing in the product editor reads or writes it.**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (eff8b54)
- Server: 24361d4 → eff8b54
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
   app/Domain/Catalog/Services/CatalogService.php |  3 +-
   app/Http/Controllers/Api/SearchController.php  |  4 +--
   app/Models/Product.php                         | 48 +++++++++++++++++---------
   3 files changed, 35 insertions(+), 20 deletions(-)
```

## 2026-10-03 05:11 UTC — `3e3443c`

**Admin product list: report availability, not raw quantity**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (3e3443c)
- Server: eff8b54 → 3e3443c
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   resources/js/Pages/Admin/Products/Index.jsx | 30 ++++++++++++++++++++++++++++-
   1 file changed, 29 insertions(+), 1 deletion(-)
```

## 2026-10-03 05:37 UTC — `05bfd50`

**Fix Duplicate button: unique SKU on the copy, and copy its images**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (05bfd50)
- Server: 3e3443c → 05bfd50
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   app/Domain/Catalog/Services/ProductService.php |  88 +++++++++++++++-
   tests/Feature/Admin/ProductDuplicateTest.php   | 133 +++++++++++++++++++++++++
   2 files changed, 217 insertions(+), 4 deletions(-)
```

## 2026-10-03 05:48 UTC — `cc68554`

**Download Template: let the browser save the file**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (cc68554)
- Server: 05bfd50 → cc68554
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   resources/js/Pages/Admin/Products/Index.jsx | 12 ++++++++++--
   1 file changed, 10 insertions(+), 2 deletions(-)
```

## 2026-10-03 10:10 UTC — `20043a2`

**Products admin: catalogue CSV export, select-all across pages, bulk is_active fix**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (20043a2)
- Server: cc68554 → 20043a2
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   .../Catalog/Services/ProductExportService.php      | 196 +++++++++++++++++++++
   app/Domain/Catalog/Services/ProductService.php     |  43 ++++-
   app/Http/Controllers/Admin/ProductController.php   |  54 +++++-
   resources/js/Pages/Admin/Products/Index.jsx        | 188 +++++++++++++++-----
   routes/admin.php                                   |   4 +
   tests/Feature/Admin/ProductBulkActionsTest.php     |  98 +++++++++++
   tests/Feature/Admin/ProductExportTest.php          | 166 +++++++++++++++++
   7 files changed, 690 insertions(+), 59 deletions(-)
```

## 2026-10-03 10:42 UTC — `2fd8a6b`

**Products admin: one Download button wired to the selection**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (2fd8a6b)
- Server: 20043a2 → 2fd8a6b
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   .../Catalog/Services/ProductExportService.php      |  27 +++--
   app/Http/Controllers/Admin/ProductController.php   |  25 +++--
   resources/js/Pages/Admin/Products/Index.jsx        | 115 +++++++++++++--------
   routes/admin.php                                   |   5 +-
   tests/Feature/Admin/ProductExportTest.php          |  53 ++++++++++
   5 files changed, 165 insertions(+), 60 deletions(-)
```

## 2026-10-03 10:57 UTC — `4100fa4`

**Admin dashboard rebuild: revenue fix, charts, sidebar alert dots**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (4100fa4)
- Server: 2fd8a6b → 4100fa4
- Migrations: 2026_10_03_000001_add_admin_dashboard_widgets ................. 13.99ms DONE
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   .../Dashboard/Services/AdminAlertService.php       |  44 +++
   app/Domain/Dashboard/Services/DashboardService.php | 311 ++++++++++++++++++++-
   app/Http/Middleware/HandleInertiaRequests.php      |   5 +
   ...26_10_03_000001_add_admin_dashboard_widgets.php | 121 ++++++++
   resources/js/Components/Dashboard/Charts.jsx       | 303 ++++++++++++++++++++
   .../js/Components/Dashboard/WidgetRenderer.jsx     | 179 +++++++++++-
   resources/js/Layouts/DashboardLayout.jsx           |  29 +-
   resources/js/Pages/Admin/Dashboard.jsx             |  28 +-
   tests/Feature/Admin/DashboardTest.php              | 181 ++++++++++++
   9 files changed, 1168 insertions(+), 33 deletions(-)
```

## 2026-10-03 11:16 UTC — `c0d3b98`

**Dashboard: range tabs fixed, combined line chart and status donut**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (c0d3b98)
- Server: 4100fa4 → c0d3b98
- Migrations: 2026_10_03_000002_reset_admin_dashboard_layouts ............... 15.34ms DONE
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   app/Domain/Dashboard/Services/DashboardService.php |  14 +-
   ..._10_03_000002_reset_admin_dashboard_layouts.php |  60 +++++
   resources/js/Components/Dashboard/Charts.jsx       | 295 +++++++++++++--------
   .../js/Components/Dashboard/WidgetRenderer.jsx     |  25 +-
   tests/Feature/Admin/DashboardTest.php              |  48 +++-
   5 files changed, 309 insertions(+), 133 deletions(-)
```

## 2026-10-05 05:55 UTC — `9d40bb2`

**Stripe config block restored, webhook CSRF fix, Full-Sized Sample wording**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (9d40bb2)
- Server: c0d3b98 → 9d40bb2
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   .env.production.example                            |  15 +++
   STRIPE_SETUP.md                                    |  13 ++-
   .../Storefront/StripeWebhookController.php         |   5 +-
   config/services.php                                |  26 +++++
   resources/js/Pages/Admin/Products/Create.jsx       |   2 +-
   resources/js/Pages/Admin/Products/Edit.jsx         |   2 +-
   resources/js/Pages/Storefront/Shop/Show.jsx        |   2 +-
   routes/web.php                                     |  25 ++++-
   ship.sh                                            |  11 +-
   tests/Feature/Payment/StripeConfigTest.php         | 123 +++++++++++++++++++++
   10 files changed, 214 insertions(+), 10 deletions(-)
```

## 2026-10-05 07:15 UTC — `90938c3`

**Stripe SDK in composer, HTTPS health check**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (90938c3)
- Server: 9d40bb2 → 90938c3
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   composer.json |  1 +
   composer.lock | 64 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-
   ship.sh       |  7 ++++++-
   3 files changed, 70 insertions(+), 2 deletions(-)
```

## 2026-10-05 07:34 UTC — `61346d2`

**Checkout routes card orders to Stripe**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (61346d2)
- Server: 90938c3 → 61346d2
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   app/Domain/Cart/Services/CheckoutService.php       | 41 ++++++++++++++++++----
   .../Controllers/Storefront/CheckoutController.php  | 19 +++++++++-
   resources/js/Pages/Builder/Checkout/Index.jsx      |  7 +++-
   resources/js/Pages/Storefront/Checkout/Index.jsx   |  7 +++-
   4 files changed, 65 insertions(+), 9 deletions(-)
```

## 2026-10-05 07:39 UTC — `e03d7e5`

**Checkout shows the real payment method**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (e03d7e5)
- Server: 61346d2 → e03d7e5
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   resources/js/Pages/Builder/Checkout/Index.jsx    | 14 +++++++-------
   resources/js/Pages/Storefront/Checkout/Index.jsx | 14 +++++++-------
   2 files changed, 14 insertions(+), 14 deletions(-)
```

## 2026-10-05 07:47 UTC — `52669d3`

**Default card country to Australia**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (52669d3)
- Server: e03d7e5 → 52669d3
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   resources/js/Pages/Storefront/Checkout/Payment.jsx | 16 +++++++++++++++-
   1 file changed, 15 insertions(+), 1 deletion(-)
```

## 2026-10-05 07:50 UTC — `fdfa873`

**Fix literal JSX on trade checkout, remove dropdown glow**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (fdfa873)
- Server: 52669d3 → fdfa873
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   resources/js/Components/Storefront/StorefrontHeader.jsx | 2 +-
   resources/js/Layouts/DashboardLayout.jsx                | 2 +-
   resources/js/Pages/Builder/Checkout/Index.jsx           | 4 ++--
   3 files changed, 4 insertions(+), 4 deletions(-)
```

## 2026-10-05 07:53 UTC — `f1e8360`

**Show card brands on checkout**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (f1e8360)
- Server: fdfa873 → f1e8360
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   resources/js/Pages/Builder/Checkout/Index.jsx    | 20 ++++++++++++++++++++
   resources/js/Pages/Storefront/Checkout/Index.jsx | 20 ++++++++++++++++++++
   2 files changed, 40 insertions(+)
```

## 2026-10-05 08:04 UTC — `4017e82`

**Hide abandoned card checkouts from admin order lists**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (4017e82)
- Server: f1e8360 → 4017e82
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   .../Controllers/Admin/BuilderOrderController.php   | 11 ++-
   app/Http/Controllers/Admin/OrderController.php     | 11 ++-
   app/Models/Order.php                               | 40 ++++++++++
   resources/js/Pages/Admin/Orders/Index.jsx          | 29 ++++++-
   .../Admin/AbandonedCheckoutVisibilityTest.php      | 89 ++++++++++++++++++++++
   5 files changed, 175 insertions(+), 5 deletions(-)
```

## 2026-10-05 08:07 UTC — `9f918ed`

**Builder Orders badge, Website/Builders order filter**

- Shipped by: `rahuldcrayons`
- GitHub: pushed to `main` (9f918ed)
- Server: 4017e82 → 9f918ed
- Migrations: INFO Nothing to migrate.
- Smoke test: /=200 /shop=200 /cart=200 /blog=200 /visualizer=200

Files changed:
```
  
   .../Dashboard/Services/AdminAlertService.php       | 18 +++++++++-
   app/Http/Controllers/Admin/OrderController.php     | 21 +++++++++++-
   resources/js/Pages/Admin/Orders/Index.jsx          | 40 +++++++++++++++++++---
   .../Admin/AbandonedCheckoutVisibilityTest.php      | 40 ++++++++++++++++++++++
   4 files changed, 113 insertions(+), 6 deletions(-)
```
