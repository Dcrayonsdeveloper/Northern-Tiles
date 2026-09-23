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
