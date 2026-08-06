#!/usr/bin/env bash
# =============================================================================
# Pre-deployment / post-deployment verification — Northern TILE Distributors
# =============================================================================
# Read-only. Changes nothing; only reports. Run it on the server before you
# announce a deploy, and again afterwards.
#
#   bash scripts/preflight-check.sh
#
# Exit codes: 0 = all pass, 1 = at least one FAIL.
# =============================================================================

set -uo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_ROOT"

PASS=0; FAIL=0; WARN=0

ok()   { echo "  [ OK ]  $1"; PASS=$((PASS+1)); }
bad()  { echo "  [FAIL]  $1"; FAIL=$((FAIL+1)); }
warn() { echo "  [WARN]  $1"; WARN=$((WARN+1)); }

env_get() {
    local key="$1" val
    val="$(grep -E "^[[:space:]]*${key}=" .env 2>/dev/null | tail -n1 | cut -d= -f2- || true)"
    val="${val%%#*}"
    echo "$val" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

PHP_BIN="$(command -v php8.2 2>/dev/null || command -v php)"

echo "=============================================="
echo " Pre-flight check"
echo " $(date)"
echo "=============================================="

# --- 1. Environment ----------------------------------------------------------
echo ""
echo "[1] Environment"

[ -f .env ] && ok ".env present" || bad ".env missing"

APP_ENV_V="$(env_get APP_ENV)"
[ "$APP_ENV_V" = "production" ] && ok "APP_ENV=production" || bad "APP_ENV is '$APP_ENV_V' (must be 'production')"

APP_DEBUG_V="$(env_get APP_DEBUG)"
case "$APP_DEBUG_V" in
    false|0|"") ok "APP_DEBUG disabled" ;;
    *) bad "APP_DEBUG='$APP_DEBUG_V' — leaks credentials on error pages" ;;
esac

APP_KEY_V="$(env_get APP_KEY)"
[ -n "$APP_KEY_V" ] && ok "APP_KEY is set" || bad "APP_KEY is empty — sessions and encryption will fail"

APP_URL_V="$(env_get APP_URL)"
case "$APP_URL_V" in
    https://*) ok "APP_URL uses https ($APP_URL_V)" ;;
    *) bad "APP_URL='$APP_URL_V' should be an https:// URL" ;;
esac

LOG_LEVEL_V="$(env_get LOG_LEVEL)"
case "$LOG_LEVEL_V" in
    error|warning|critical) ok "LOG_LEVEL=$LOG_LEVEL_V" ;;
    *) warn "LOG_LEVEL='$LOG_LEVEL_V' — 'debug' fills the disk quota fast" ;;
esac

SECURE_COOKIE_V="$(env_get SESSION_SECURE_COOKIE)"
[ "$SECURE_COOKIE_V" = "true" ] && ok "SESSION_SECURE_COOKIE=true" \
    || warn "SESSION_SECURE_COOKIE is not true — session cookie may be sent over plain HTTP"

# --- 2. Permissions ----------------------------------------------------------
echo ""
echo "[2] File permissions"

ENV_PERMS="$(stat -c '%a' .env 2>/dev/null || stat -f '%Lp' .env 2>/dev/null || echo '?')"
case "$ENV_PERMS" in
    600|640|660) ok ".env permissions $ENV_PERMS" ;;
    ?) warn "could not stat .env permissions" ;;
    *) bad ".env permissions are $ENV_PERMS — should be 600" ;;
esac

[ -w storage ] && ok "storage/ writable" || bad "storage/ not writable"
[ -w bootstrap/cache ] && ok "bootstrap/cache writable" || bad "bootstrap/cache not writable"

if [ -d storage/backups ]; then
    BK_PERMS="$(stat -c '%a' storage/backups 2>/dev/null || echo '?')"
    [ "$BK_PERMS" = "700" ] && ok "storage/backups is 700" \
        || warn "storage/backups is $BK_PERMS — backups contain all your data, prefer 700"
fi

# --- 3. Web-root exposure ----------------------------------------------------
echo ""
echo "[3] Web-root exposure"

if [ -f public/index.php ] && [ ! -f index.php ]; then
    ok "Application root is not the web root (public/ layout)"
else
    warn "Application root may be the web root — root .htaccess deny rules must be active"
fi

SQL_IN_ROOT="$(find . -maxdepth 1 -name '*.sql' 2>/dev/null | wc -l)"
[ "$SQL_IN_ROOT" -eq 0 ] && ok "No .sql dumps in application root" \
    || bad "$SQL_IN_ROOT .sql dump(s) in application root — remove them from the server"

# --- 4. Database -------------------------------------------------------------
echo ""
echo "[4] Database"

DB_OUT="$($PHP_BIN artisan db:show --json 2>/dev/null)"
if [ -n "$DB_OUT" ]; then
    ok "Database connection succeeded"
    TABLES="$($PHP_BIN artisan db:table --json 2>/dev/null | head -c 0; echo "$DB_OUT" | grep -o '"tables":[0-9]*' | cut -d: -f2)"
    [ -n "$TABLES" ] && echo "          tables: $TABLES"
else
    bad "Cannot connect to the database — check DB_* credentials"
fi

PENDING="$($PHP_BIN artisan migrate:status 2>/dev/null | grep -ci pending || true)"
if [ "$PENDING" -eq 0 ]; then
    ok "No pending migrations"
else
    warn "$PENDING pending migration(s) — deploy with run_migrations enabled"
fi

# --- 5. Backups --------------------------------------------------------------
echo ""
echo "[5] Backups"

LATEST="$(ls -1t storage/backups/*.sql.gz 2>/dev/null | head -1 || true)"
if [ -n "$LATEST" ]; then
    AGE_S=$(( $(date +%s) - $(stat -c %Y "$LATEST" 2>/dev/null || echo 0) ))
    AGE_H=$(( AGE_S / 3600 ))
    if gzip -t "$LATEST" 2>/dev/null && gunzip -c "$LATEST" | tail -5 | grep -q "Dump completed"; then
        ok "Latest backup valid, ${AGE_H}h old ($(basename "$LATEST"))"
    else
        bad "Latest backup is corrupt or truncated: $(basename "$LATEST")"
    fi
    [ "$AGE_H" -gt 48 ] && warn "Newest backup is ${AGE_H}h old — is the backup cron running?"
else
    bad "No backups found in storage/backups/"
fi

# --- 6. Assets ---------------------------------------------------------------
echo ""
echo "[6] Frontend assets"

if [ -f public/build/manifest.json ]; then
    ok "Vite manifest present ($(find public/build/assets -type f 2>/dev/null | wc -l) asset files)"
else
    bad "public/build/manifest.json missing — site will render unstyled"
fi

if [ -f public/build/build-meta.json ]; then
    BUILD_LEGACY="$(grep -o '"legacyPublicPrefix": *\(true\|false\)' public/build/build-meta.json | grep -o 'true\|false')"
    RUNTIME_LEGACY="$($PHP_BIN artisan tinker --execute='echo config("deployment.legacy_public_prefix") ? "true" : "false";' 2>/dev/null | tr -d '[:space:]' | tail -c5)"
    if [ "$BUILD_LEGACY" = "$RUNTIME_LEGACY" ]; then
        ok "Asset path layout consistent (legacy_public_prefix=$BUILD_LEGACY)"
    else
        bad "Asset layout MISMATCH — build=$BUILD_LEGACY runtime=$RUNTIME_LEGACY. Every asset will 404."
    fi
else
    warn "public/build/build-meta.json missing — cannot verify asset layout"
fi

# --- 7. Storage symlink and uploads -----------------------------------------
echo ""
echo "[7] Uploads"

if [ -L public/storage ]; then
    TARGET="$(readlink -f public/storage 2>/dev/null)"
    if [ -d "$TARGET" ]; then
        ok "public/storage -> $TARGET"
    else
        bad "public/storage symlink is broken (points at $TARGET) — run: php artisan storage:link"
    fi
elif [ -d public/storage ]; then
    warn "public/storage is a real directory, not a symlink"
else
    bad "public/storage missing — run: php artisan storage:link"
fi

UPLOADS="$(find storage/app/public -type f 2>/dev/null | wc -l)"
[ "$UPLOADS" -gt 0 ] && ok "$UPLOADS uploaded file(s) present" || warn "storage/app/public is empty"

# --- 8. Caches ---------------------------------------------------------------
echo ""
echo "[8] Production caches"

[ -f bootstrap/cache/config.php ] && ok "config cached" || warn "config not cached — run: php artisan config:cache"
[ -f bootstrap/cache/routes-v7.php ] && ok "routes cached" || warn "routes not cached — run: php artisan route:cache"

# --- 9. Background processing ------------------------------------------------
echo ""
echo "[9] Scheduler and queue"

if crontab -l 2>/dev/null | grep -q "schedule:run"; then
    ok "schedule:run cron entry found"
else
    bad "No schedule:run cron entry — abandoned-cart emails and reindexing will never run"
fi

if crontab -l 2>/dev/null | grep -qE "queue:work|queue:listen"; then
    ok "queue worker cron entry found"
elif pgrep -f "artisan queue:work" >/dev/null 2>&1; then
    ok "queue worker process running"
else
    bad "No queue worker — queued jobs and emails will never be processed"
fi

PENDING_JOBS="$($PHP_BIN artisan tinker --execute='echo DB::table("jobs")->count();' 2>/dev/null | tr -d '[:space:]' | grep -o '[0-9]*$' || echo '?')"
FAILED_JOBS="$($PHP_BIN artisan tinker --execute='echo DB::table("failed_jobs")->count();' 2>/dev/null | tr -d '[:space:]' | grep -o '[0-9]*$' || echo '?')"
echo "          queued: $PENDING_JOBS   failed: $FAILED_JOBS"
[ "$FAILED_JOBS" != "0" ] && [ "$FAILED_JOBS" != "?" ] && warn "$FAILED_JOBS failed job(s) — inspect with: php artisan queue:failed"

# --- 10. Errors --------------------------------------------------------------
echo ""
echo "[10] Recent errors"

RECENT_ERRORS=0
for lf in storage/logs/laravel*.log; do
    [ -f "$lf" ] || continue
    N="$(grep -c "\.ERROR\|\.CRITICAL\|\.EMERGENCY" "$lf" 2>/dev/null || echo 0)"
    RECENT_ERRORS=$((RECENT_ERRORS + N))
done
[ "$RECENT_ERRORS" -eq 0 ] && ok "No ERROR/CRITICAL entries in logs" \
    || warn "$RECENT_ERRORS error entries in logs — review storage/logs/"

# --- Summary -----------------------------------------------------------------
echo ""
echo "=============================================="
echo " PASS: $PASS   WARN: $WARN   FAIL: $FAIL"
echo "=============================================="

[ "$FAIL" -gt 0 ] && exit 1
exit 0
