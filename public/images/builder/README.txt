hero-banner.png
---------------
The Builder & Contractor Portal hero artwork: navy field, gold arc, fanned tile
slabs at the right.

Save the banner here as exactly:

    public/images/builder/hero-banner.png

The dashboard uses it as the hero background (bg-cover bg-right), with the copy
over the flat left-hand side. bg-navy sits underneath, so until this file exists
the hero renders as plain navy with the text still readable - it does not break.

Wide artwork works best; the source used was roughly 2.5:1. If you save a .jpg
or .webp instead, update HERO_BANNER in
resources/js/Pages/Builder/Dashboard.jsx to match the extension.
