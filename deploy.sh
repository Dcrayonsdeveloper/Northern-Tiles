#!/usr/bin/env bash
# =============================================================================
# Manual deployment — Northern TILE Distributors (ntiled.com.au)
# =============================================================================
# Server-side fallback for when you cannot use the GitHub Actions workflow.
# Mirrors the same safety model:
#   backup -> build -> migrate (opt-in) -> cache -> atomic swap -> health check
#
#   bash deploy.sh <base-path>                 # deploy, no migrations
#   bash deploy.sh <base-path> --migrate       # deploy and apply migrations
#
# This script NEVER runs migrate:fresh, db:wipe or seeders.
# =============================================================================

set -euo pipefail

BASE="${1:-}"
MIGRATE="${2:-}"

if [ -z "$BASE" ]; then
    echo "Usage: bash deploy.sh <base-path> [--migrate]" >&2
    echo "Example: bash deploy.sh /home/u123456789/domains/ntiled.com.au" >&2
    exit 1
fi

if [ ! -d "$BASE/shared" ]; then
    echo "ERROR: $BASE/shared not found. Run hostinger-setup.sh first." >&2
    exit 1
fi

STAMP="$(date -u +%Y%m%d-%H%M%S)"
RELEASE="$BASE/releases/$STAMP-manual"
PHP_BIN="$(command -v php8.2 || command -v php)"

echo "=========================================="
echo "  Deploying Northern TILE Distributors"
echo "  Release: $STAMP"
echo "=========================================="

# --- 1. Back up before anything else ----------------------------------------
if [ -f "$BASE/current/artisan" ]; then
    echo "[1/7] Backing up production database..."
    ( cd "$BASE/current" && bash scripts/db-backup.sh pre-deploy ) || {
        echo "ERROR: backup failed — aborting deploy. Production untouched." >&2
        exit 1
    }
else
    echo "[1/7] No current release — first deploy, skipping backup."
fi

# --- 2. Stage the new release ------------------------------------------------
echo "[2/7] Staging release..."
mkdir -p "$RELEASE"

if [ -d "$BASE/current" ]; then
    # Copy the live release as a starting point, then update it from git.
    cp -a "$BASE/current/." "$RELEASE/"
    rm -rf "$RELEASE/storage" "$RELEASE/.env" "$RELEASE/public/storage"
fi

cd "$RELEASE"
if [ -d .git ]; then
    git fetch --all --prune
    git reset --hard origin/main
else
    echo "WARNING: no git repo in release — using copied files as-is."
fi

# --- 3. Shared state ---------------------------------------------------------
echo "[3/7] Linking shared .env and storage..."
ln -sfn "$BASE/shared/.env" "$RELEASE/.env"
rm -rf "$RELEASE/storage"
ln -sfn "$BASE/shared/storage" "$RELEASE/storage"

# --- 4. Dependencies and assets ---------------------------------------------
echo "[4/7] Installing dependencies and building assets..."
if [ -f composer.phar ]; then
    $PHP_BIN composer.phar install --no-dev --optimize-autoloader --no-interaction
else
    composer install --no-dev --optimize-autoloader --no-interaction
fi

if command -v npm >/dev/null 2>&1; then
    npm ci && npm run build
else
    echo "WARNING: npm unavailable — public/build must already be present."
    test -f public/build/manifest.json || {
        echo "ERROR: no built assets and no npm. Aborting." >&2
        exit 1
    }
fi

# --- 5. Migrations (opt-in, additive only) -----------------------------------
if [ "$MIGRATE" = "--migrate" ]; then
    echo "[5/7] Applying additive migrations..."
    $PHP_BIN artisan migrate:status | grep -i pending || echo "  (none pending)"
    $PHP_BIN artisan migrate --force --no-interaction
else
    echo "[5/7] Skipping migrations (pass --migrate to apply)."
fi

# --- 6. Warm caches on the new release --------------------------------------
echo "[6/7] Optimising..."
chmod -R 775 bootstrap/cache
rm -f public/storage
$PHP_BIN artisan storage:link
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:cache
$PHP_BIN artisan event:cache 2>/dev/null || true

# --- 7. Atomic swap ----------------------------------------------------------
echo "[7/7] Activating release..."
if [ -L "$BASE/current" ]; then
    readlink -f "$BASE/current" > "$BASE/.previous-release"
fi
ln -sfn "$RELEASE" "$BASE/current.tmp"
mv -Tf "$BASE/current.tmp" "$BASE/current"

cd "$BASE/current"
$PHP_BIN artisan queue:restart || true

# --- Health check ------------------------------------------------------------
URL="${PRODUCTION_URL:-https://ntiled.com.au}"
sleep 3
CODE="$(curl -sS -o /dev/null -w '%{http_code}' -L --max-time 30 "$URL/up" || echo 000)"
echo ""
echo "Health check: GET $URL/up -> $CODE"

if [ "$CODE" != "200" ]; then
    echo "!! Health check FAILED — rolling back." >&2
    if [ -f "$BASE/.previous-release" ]; then
        PREV="$(cat "$BASE/.previous-release")"
        ln -sfn "$PREV" "$BASE/current.tmp"
        mv -Tf "$BASE/current.tmp" "$BASE/current"
        echo "Rolled back to $PREV" >&2
    fi
    exit 1
fi

# --- Prune old releases ------------------------------------------------------
CURRENT="$(readlink -f "$BASE/current")"
cd "$BASE/releases"
ls -1dt */ 2>/dev/null | tail -n +6 | while read -r old; do
    [ "$(readlink -f "$old")" = "$CURRENT" ] && continue
    echo "Pruning old release: $old"
    rm -rf "$old"
done

echo ""
echo "=========================================="
echo "  Deployment complete — $URL"
echo "  Live release: $CURRENT"
echo "=========================================="
