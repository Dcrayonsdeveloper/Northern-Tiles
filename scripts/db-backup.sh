#!/usr/bin/env bash
# =============================================================================
# Database backup — Northern TILE Distributors
# =============================================================================
# Creates a compressed, verified mysqldump of the application database.
# Reads credentials from .env so it works identically on local and production.
#
#   bash scripts/db-backup.sh                 # normal backup
#   bash scripts/db-backup.sh pre-deploy      # tagged backup (use before deploys)
#
# Backups land in storage/backups/ and the newest RETENTION files are kept.
# Exits non-zero if the dump is missing, empty, or fails verification — so a
# deploy script can safely do:  bash scripts/db-backup.sh pre-deploy || exit 1
# =============================================================================

set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_ROOT"

TAG="${1:-manual}"
BACKUP_DIR="$APP_ROOT/storage/backups"
RETENTION=14

if [ ! -f .env ]; then
    echo "ERROR: .env not found at $APP_ROOT/.env" >&2
    exit 1
fi

# Read a key from .env, stripping quotes, comments and whitespace.
env_get() {
    local key="$1"
    local val
    val="$(grep -E "^[[:space:]]*${key}=" .env | tail -n1 | cut -d= -f2- || true)"
    val="${val%%#*}"
    val="$(echo "$val" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/")"
    echo "$val"
}

DB_HOST="$(env_get DB_HOST)";         DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="$(env_get DB_PORT)";         DB_PORT="${DB_PORT:-3306}"
DB_DATABASE="$(env_get DB_DATABASE)"
DB_USERNAME="$(env_get DB_USERNAME)"
DB_PASSWORD="$(env_get DB_PASSWORD)"

if [ -z "$DB_DATABASE" ]; then
    echo "ERROR: DB_DATABASE is empty in .env — refusing to back up." >&2
    exit 1
fi

# Locate mysqldump (XAMPP on Windows, PATH everywhere else).
MYSQLDUMP="$(command -v mysqldump || true)"
if [ -z "$MYSQLDUMP" ] && [ -x "/c/xampp/mysql/bin/mysqldump.exe" ]; then
    MYSQLDUMP="/c/xampp/mysql/bin/mysqldump.exe"
fi
if [ -z "$MYSQLDUMP" ]; then
    echo "ERROR: mysqldump not found in PATH." >&2
    exit 1
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR" 2>/dev/null || true

STAMP="$(date +%Y%m%d-%H%M%S)"
OUTFILE="$BACKUP_DIR/${DB_DATABASE}_${TAG}_${STAMP}.sql.gz"

echo "==> Backing up '$DB_DATABASE' from $DB_HOST:$DB_PORT"
echo "    -> $OUTFILE"

# Pass the password via a temp defaults file so it never appears in `ps`.
CNF="$(mktemp)"
chmod 600 "$CNF"
cleanup() { rm -f "$CNF"; }
trap cleanup EXIT

{
    echo "[client]"
    echo "host=${DB_HOST}"
    echo "port=${DB_PORT}"
    echo "user=${DB_USERNAME}"
    echo "password=${DB_PASSWORD}"
} > "$CNF"

# --single-transaction : consistent snapshot without locking InnoDB tables
#                        (keeps the site online while the backup runs)
# --routines/--triggers/--events : preserve stored programs
# --no-tablespaces     : avoids needing PROCESS privilege on shared hosting
set +e
"$MYSQLDUMP" --defaults-extra-file="$CNF" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    --no-tablespaces \
    --default-character-set=utf8mb4 \
    --add-drop-table \
    "$DB_DATABASE" 2> "$BACKUP_DIR/.dump-stderr" | gzip -9 > "$OUTFILE"
DUMP_STATUS="${PIPESTATUS[0]}"
set -e

if [ "$DUMP_STATUS" -ne 0 ]; then
    echo "ERROR: mysqldump failed (exit $DUMP_STATUS):" >&2
    cat "$BACKUP_DIR/.dump-stderr" >&2
    rm -f "$OUTFILE"
    exit 1
fi
rm -f "$BACKUP_DIR/.dump-stderr"

# ---- Verification -----------------------------------------------------------
# A backup you have not verified is not a backup.
if [ ! -s "$OUTFILE" ]; then
    echo "ERROR: backup file is empty." >&2
    rm -f "$OUTFILE"
    exit 1
fi

if ! gzip -t "$OUTFILE" 2>/dev/null; then
    echo "ERROR: backup archive is corrupt (gzip -t failed)." >&2
    exit 1
fi

# Confirm the dump actually terminated — mysqldump writes this as its last line.
if ! gunzip -c "$OUTFILE" | tail -5 | grep -q "Dump completed"; then
    echo "ERROR: dump is truncated ('Dump completed' marker missing)." >&2
    exit 1
fi

TABLE_COUNT="$(gunzip -c "$OUTFILE" | grep -c '^CREATE TABLE' || true)"
SIZE="$(du -h "$OUTFILE" | cut -f1)"

if [ "$TABLE_COUNT" -lt 1 ]; then
    echo "ERROR: dump contains no CREATE TABLE statements." >&2
    exit 1
fi

chmod 600 "$OUTFILE" 2>/dev/null || true

echo "==> OK: $TABLE_COUNT tables, $SIZE"

# ---- Rotation ---------------------------------------------------------------
cd "$BACKUP_DIR"
ls -1t ${DB_DATABASE}_*.sql.gz 2>/dev/null | tail -n +$((RETENTION + 1)) | while read -r old; do
    echo "==> Rotating out old backup: $old"
    rm -f "$old"
done

echo "==> Backup complete: $OUTFILE"
echo "$OUTFILE"
