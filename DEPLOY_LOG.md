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
