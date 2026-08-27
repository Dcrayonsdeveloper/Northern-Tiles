hero-banner.png
---------------
The Builder & Contractor Portal hero artwork: navy field, gold arc, fanned tile
slabs at the right. Installed - the dashboard is using it.

To replace it, overwrite this file at the same path and filename. Nothing else
needs changing.

Notes:
  - Wide artwork works best. This one is 1983x793 (2.5:1).
  - Its background navy is #093163, which is also the Tailwind `navy` colour the
    hero card uses. If you swap in artwork with a different background, sample
    its navy and update `navy.DEFAULT` in tailwind.config.js to match, or the
    image's edge will show as a seam against the card.
  - A different extension (.jpg/.webp) needs HERO_BANNER updating in
    app/Domain/Builder/Http/Controllers/Builder/BuilderDashboardController.php
  - If this file is deleted the dashboard falls back to drawn SVG artwork, so
    the hero is never empty.
