#!/usr/bin/env bash
# =============================================================================
# ONE-TIME server bootstrap — Northern TILE Distributors
# =============================================================================
# Run this ONCE on a fresh server to create the shared directory layout that
# deploy-hostinger.yml expects. It is safe to re-run: it never overwrites an
# existing .env, never touches the database, and never rotates APP_KEY.
#
#   bash hostinger-setup.sh /home/uXXXXXXXX/domains/ntiled.com.au
#
# Resulting layout:
#   <base>/shared/.env          <- production credentials (you create/edit this)
#   <base>/shared/storage/      <- uploads, logs, backups (survives all deploys)
#   <base>/releases/<stamp>/    <- one directory per deploy
#   <base>/current -> releases/<stamp>   <- atomic symlink, the live release
#
# IMPORTANT: point the domain's document root at  <base>/current/public
# in hPanel → Websites → Manage → Advanced. That keeps .env, storage/ and
# vendor/ outside the web root. Do NOT move public/* into the web root.
# =============================================================================

set -euo pipefail

BASE="${1:-}"

if [ -z "$BASE" ]; then
    echo "Usage: bash hostinger-setup.sh <absolute-path-to-domain-dir>" >&2
    echo "Example: bash hostinger-setup.sh /home/u123456789/domains/ntiled.com.au" >&2
    exit 1
fi

echo "=== Creating shared layout under $BASE ==="
mkdir -p "$BASE/releases"
mkdir -p "$BASE/shared/storage/app/public"
mkdir -p "$BASE/shared/storage/framework/cache/data"
mkdir -p "$BASE/shared/storage/framework/sessions"
mkdir -p "$BASE/shared/storage/framework/views"
mkdir -p "$BASE/shared/storage/logs"
mkdir -p "$BASE/shared/storage/backups"

chmod -R 775 "$BASE/shared/storage"
chmod 700 "$BASE/shared/storage/backups"   # backups contain all your data

# --- .env -------------------------------------------------------------------
# Created empty-if-missing ONLY. An existing .env is never modified, so a
# re-run can't clobber production credentials or the APP_KEY.
if [ -f "$BASE/shared/.env" ]; then
    echo "=== shared/.env already exists — leaving it untouched ==="
else
    echo "=== Creating shared/.env placeholder ==="
    cat > "$BASE/shared/.env" <<'ENVEOF'
# Fill this in from .env.production.example, then run:
#   php artisan key:generate --force     (ONLY on a brand-new install)
#
# WARNING: never regenerate APP_KEY on a site that already has data.
# It is used to encrypt sessions and any encrypted columns; changing it
# makes existing encrypted values permanently unreadable.
APP_KEY=
ENVEOF
fi
chmod 600 "$BASE/shared/.env"

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps (manual, in order):"
echo ""
echo "  1. Edit $BASE/shared/.env"
echo "     Copy the contents of .env.production.example and fill in real values."
echo ""
echo "  2. If this is a BRAND-NEW install with no data, generate an app key:"
echo "       cd $BASE/shared && php artisan key:generate --force"
echo "     If you are migrating an EXISTING site, copy the OLD APP_KEY across"
echo "     verbatim instead. Do not generate a new one."
echo ""
echo "  3. Point the domain document root at:  $BASE/current/public"
echo "     (hPanel -> Websites -> Manage -> Advanced -> Change document root)"
echo ""
echo "  4. Import your database, then run the GitHub Actions deploy workflow."
echo ""
echo "  5. Add the cron entries from PRODUCTION_DEPLOYMENT.md section 4"
echo "     (scheduler, queue worker and nightly backup — none run without them)."
echo ""
echo "  6. Verify:  cd $BASE/current && bash scripts/preflight-check.sh"
echo ""
