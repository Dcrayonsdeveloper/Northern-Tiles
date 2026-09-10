#!/usr/bin/env bash
# =============================================================================
# Deploy to the EC2 box — Northern TILE Distributors
# =============================================================================
# Builds a release from a git ref and ships it to the production server
# described in AWS_EC2_DEPLOYMENT.md. Run from a workstation, not the server.
#
#   bash scripts/deploy-ec2.sh                    # deploy origin/main
#   bash scripts/deploy-ec2.sh origin/main        # same, explicit
#   bash scripts/deploy-ec2.sh v1.2.0             # any ref
#   DRY_RUN=1 bash scripts/deploy-ec2.sh          # build and package only
#
# Override the target with env vars if it moves:
#   EC2_HOST=ubuntu@1.2.3.4 EC2_KEY=/path/to.pem bash scripts/deploy-ec2.sh
#
# -----------------------------------------------------------------------------
# SAFETY MODEL — mirrors .github/workflows/deploy-hostinger.yml
# -----------------------------------------------------------------------------
# 1. The release is built from a clean `git archive` of the ref, never from the
#    working tree, so uncommitted local edits can never reach production.
# 2. A verified database backup is taken before anything changes. If it fails
#    the deploy stops and the live site is untouched.
# 3. The release is staged in releases/<stamp>/ and activated by an atomic
#    symlink swap, so a request is served entirely by the old release or
#    entirely by the new one — never a half-extracted mix.
# 4. .env and storage/ are SHARED across releases and are never packaged, so
#    credentials and uploads survive.
# 5. Migrations run additively (`migrate --force`). migrate:fresh, refresh and
#    db:wipe must never appear in this file.
# 6. The site is health-checked after activation and rolled back automatically
#    if it does not return 200.
# =============================================================================

set -euo pipefail

REF="${1:-origin/main}"
EC2_HOST="${EC2_HOST:-ubuntu@52.62.171.34}"
EC2_KEY="${EC2_KEY:-Northern Tile Distributors.pem}"
BASE="${EC2_BASE:-/var/www/ntiled}"
HEALTH_HOST="${HEALTH_HOST:-besttiles.shop}"
DRY_RUN="${DRY_RUN:-0}"

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_ROOT"

[ -f "$EC2_KEY" ] || { echo "SSH key not found: $EC2_KEY" >&2; exit 1; }

SHA="$(git rev-parse --short "$REF")"
STAGE="$(mktemp -d)"
PACKAGE="$STAGE/release.tar.gz"
trap 'rm -rf "$STAGE"' EXIT

ssh_do() { ssh -i "$EC2_KEY" "$EC2_HOST" "$@"; }

echo "==> Deploying $REF ($SHA) to $EC2_HOST"

# ── 1. Clean export ──────────────────────────────────────────────────────────
echo "==> 1/9  Exporting $REF"
mkdir -p "$STAGE/app"
git archive "$REF" | tar -x -C "$STAGE/app"

# ── 2. Build assets ──────────────────────────────────────────────────────────
# Built here rather than on the server: the box has 1.8 GB of RAM and the Vite
# build peaks above it (that is what the 2 GB swap is for — don't rely on it).
# VITE_LEGACY_PUBLIC_PREFIX must match the server's runtime flag or the site
# loads with no CSS or JS; step 7 asserts they agree before going live.
echo "==> 2/9  Building assets"
cp -r node_modules "$STAGE/app/node_modules"
( cd "$STAGE/app" && VITE_LEGACY_PUBLIC_PREFIX=false npm run build >/dev/null )

test -f "$STAGE/app/public/build/manifest.json" \
  || { echo "build produced no manifest — aborting" >&2; exit 1; }

# ── 3. Package ───────────────────────────────────────────────────────────────
echo "==> 3/9  Packaging"
( cd "$STAGE/app" && tar -czf "$PACKAGE" \
    --exclude='./node_modules' --exclude='./.git' --exclude='./.github' \
    --exclude='./tests' --exclude='./deploy' \
    --exclude='./.env' --exclude='./.env.*' \
    --exclude='./storage' --exclude='./public/storage' \
    --exclude='./*.sql' --exclude='./*.pem' --exclude='./*.ppk' \
    . )

# Belt-and-braces: prove no credentials are in the artifact.
if tar -tzf "$PACKAGE" | grep -qE '(^|/)\.env$|\.sql$|\.pem$|\.ppk$'; then
    echo "package contains secrets — aborting" >&2
    tar -tzf "$PACKAGE" | grep -E '(^|/)\.env$|\.sql$|\.pem$|\.ppk$' >&2
    exit 1
fi
echo "    $(du -h "$PACKAGE" | cut -f1), no secrets"

if [ "$DRY_RUN" != "0" ]; then
    # Keep the staging dir (the EXIT trap would remove it) so the package can
    # be inspected. Deliberately left outside the repo so a stray tarball can
    # never be committed by accident.
    trap - EXIT
    echo "DRY_RUN — package left at $PACKAGE, nothing deployed"
    exit 0
fi

# ── 4. Upload ────────────────────────────────────────────────────────────────
echo "==> 4/9  Uploading"
scp -i "$EC2_KEY" "$PACKAGE" "$EC2_HOST:/tmp/release.tar.gz"

# ── 5. Back up first ─────────────────────────────────────────────────────────
echo "==> 5/9  Backing up the database"
ssh_do "set -euo pipefail
        cd '$BASE/current'
        bash scripts/db-backup.sh pre-deploy"

# ── 6. Stage beside the live release ─────────────────────────────────────────
echo "==> 6/9  Staging release"
ssh_do "set -euo pipefail
        RELEASE='$BASE/releases/\$(date -u +%Y%m%d-%H%M%S)-$SHA'
        echo \"\$RELEASE\" > '$BASE/.next-release'

        mkdir -p \"\$RELEASE\"
        tar -xzf /tmp/release.tar.gz -C \"\$RELEASE\"
        rm -f /tmp/release.tar.gz

        ln -sfn '$BASE/shared/.env' \"\$RELEASE/.env\"
        rm -rf \"\$RELEASE/storage\"
        ln -sfn '$BASE/shared/storage' \"\$RELEASE/storage\"
        chmod -R 775 \"\$RELEASE/bootstrap/cache\"

        cd \"\$RELEASE\"
        composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
        echo \"    staged \$RELEASE\""

# ── 7. Migrate and warm caches (still not live) ──────────────────────────────
echo "==> 7/9  Migrating and caching"
ssh_do "set -euo pipefail
        cd \$(cat '$BASE/.next-release')

        php artisan migrate:status | grep -i pending || echo '    (no pending migrations)'
        php artisan migrate --force --no-interaction

        rm -f public/storage
        ln -sfn '$BASE/shared/storage/app/public' public/storage

        php artisan config:cache
        php artisan route:cache
        php artisan view:cache
        php artisan event:cache 2>/dev/null || true

        # A cached config ignores .env entirely, so smoke-test after caching.
        php artisan about --only=environment >/dev/null

        BUILD_LEGACY=\$(grep -o '\"legacyPublicPrefix\": *\(true\|false\)' \
                         public/build/build-meta.json | grep -o 'true\|false')
        if [ \"\$BUILD_LEGACY\" != 'false' ]; then
          echo \"asset prefix mismatch (build=\$BUILD_LEGACY) — assets would 404\" >&2
          exit 1
        fi"

# ── 8. Activate ──────────────────────────────────────────────────────────────
echo "==> 8/9  Activating"
ssh_do "set -euo pipefail
        RELEASE=\$(cat '$BASE/.next-release')
        readlink -f '$BASE/current' > '$BASE/.previous-release'

        ln -sfn \"\$RELEASE\" '$BASE/current.tmp'
        mv -Tf '$BASE/current.tmp' '$BASE/current'
        echo \"    now live: \$(readlink -f '$BASE/current')\"

        sudo systemctl reload php8.3-fpm
        sudo systemctl restart ntiled-queue"

# ── 9. Verify, roll back if the site is down ─────────────────────────────────
# certbot --redirect made port 80 return 404 for anything but the domain, so a
# plain http://127.0.0.1/up looks like an outage. Resolve the TLS vhost locally
# instead — DNS-independent, and it exercises the real certificate.
echo "==> 9/9  Health check"
ssh_do "set -euo pipefail
        sleep 5
        CODE=\$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 \
                 --resolve '$HEALTH_HOST:443:127.0.0.1' \
                 'https://$HEALTH_HOST/up' || echo 000)
        echo \"    GET /up -> \$CODE\"

        if [ \"\$CODE\" != '200' ]; then
          echo 'health check failed — rolling back' >&2
          PREV=\$(cat '$BASE/.previous-release')
          ln -sfn \"\$PREV\" '$BASE/current.tmp'
          mv -Tf '$BASE/current.tmp' '$BASE/current'
          sudo systemctl reload php8.3-fpm
          echo \"rolled back to \$PREV\" >&2
          exit 1
        fi"

# Keep the newest 5 releases, never deleting the live one.
ssh_do "set -euo pipefail
        CURRENT=\$(readlink -f '$BASE/current')
        cd '$BASE/releases'
        ls -1dt */ 2>/dev/null | tail -n +6 | while read -r old; do
          [ \"\$(readlink -f \"\$old\")\" = \"\$CURRENT\" ] && continue
          rm -rf \"\$old\"
        done" || true

echo
echo "Deployed $REF ($SHA) to https://$HEALTH_HOST"
echo "Roll back with:  ssh -i \"$EC2_KEY\" $EC2_HOST '$BASE/rollback.sh'"
