#!/usr/bin/env bash
# =============================================================================
# Database restore — Northern TILE Distributors
# =============================================================================
# Restores a backup produced by scripts/db-backup.sh.
#
#   bash scripts/db-restore.sh storage/backups/<file>.sql.gz            # dry run
#   bash scripts/db-restore.sh storage/backups/<file>.sql.gz --confirm  # execute
#
# Without --confirm this only inspects the archive and reports what WOULD be
# restored. Nothing touches the database until you pass --confirm.
#
# A safety backup of the CURRENT database is always taken before overwriting,
# so an incorrect restore is itself reversible.
# =============================================================================

set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_ROOT"

ARCHIVE="${1:-}"
CONFIRM="${2:-}"

if [ -z "$ARCHIVE" ]; then
    echo "Usage: bash scripts/db-restore.sh <backup.sql.gz> [--confirm]" >&2
    echo "" >&2
    echo "Available backups:" >&2
    ls -1t storage/backups/*.sql.gz 2>/dev/null | head -20 >&2 || echo "  (none)" >&2
    exit 1
fi

if [ ! -f "$ARCHIVE" ]; then
    echo "ERROR: backup not found: $ARCHIVE" >&2
    exit 1
fi

env_get() {
    local key="$1" val
    val="$(grep -E "^[[:space:]]*${key}=" .env | tail -n1 | cut -d= -f2- || true)"
    val="${val%%#*}"
    echo "$val" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

DB_HOST="$(env_get DB_HOST)";     DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="$(env_get DB_PORT)";     DB_PORT="${DB_PORT:-3306}"
DB_DATABASE="$(env_get DB_DATABASE)"
DB_USERNAME="$(env_get DB_USERNAME)"
DB_PASSWORD="$(env_get DB_PASSWORD)"

MYSQL="$(command -v mysql || true)"
if [ -z "$MYSQL" ] && [ -x "/c/xampp/mysql/bin/mysql.exe" ]; then
    MYSQL="/c/xampp/mysql/bin/mysql.exe"
fi
if [ -z "$MYSQL" ]; then
    echo "ERROR: mysql client not found in PATH." >&2
    exit 1
fi

# ---- Inspect the archive before trusting it ---------------------------------
echo "==> Archive:  $ARCHIVE"
echo "==> Size:     $(du -h "$ARCHIVE" | cut -f1)"

if ! gzip -t "$ARCHIVE" 2>/dev/null; then
    echo "ERROR: archive is corrupt — refusing to restore." >&2
    exit 1
fi

if ! gunzip -c "$ARCHIVE" | tail -5 | grep -q "Dump completed"; then
    echo "ERROR: archive is truncated — refusing to restore." >&2
    exit 1
fi

TABLES="$(gunzip -c "$ARCHIVE" | grep -c '^CREATE TABLE' || true)"
echo "==> Tables:   $TABLES"
echo "==> Target:   $DB_DATABASE on $DB_HOST:$DB_PORT"

if [ "$CONFIRM" != "--confirm" ]; then
    echo ""
    echo "DRY RUN — nothing was changed."
    echo "Re-run with --confirm to restore into '$DB_DATABASE'."
    exit 0
fi

# ---- Safety net: back up what we are about to overwrite ---------------------
echo ""
echo "==> Taking a safety backup of the CURRENT database first..."
bash "$APP_ROOT/scripts/db-backup.sh" pre-restore >/dev/null || {
    echo "ERROR: safety backup failed — aborting restore." >&2
    exit 1
}
echo "==> Safety backup OK."

CNF="$(mktemp)"; chmod 600 "$CNF"
trap 'rm -f "$CNF"' EXIT
{
    echo "[client]"
    echo "host=${DB_HOST}"
    echo "port=${DB_PORT}"
    echo "user=${DB_USERNAME}"
    echo "password=${DB_PASSWORD}"
} > "$CNF"

echo "==> Restoring..."
gunzip -c "$ARCHIVE" | "$MYSQL" --defaults-extra-file="$CNF" \
    --default-character-set=utf8mb4 "$DB_DATABASE"

echo "==> Restore complete. Verifying..."
"$MYSQL" --defaults-extra-file="$CNF" -N -B -e \
    "SELECT CONCAT('tables: ', COUNT(*)) FROM information_schema.tables WHERE table_schema='${DB_DATABASE}';"

php artisan migrate:status 2>/dev/null | tail -5 || true

echo "==> Done. Clear caches next:  php artisan optimize:clear && php artisan optimize"
