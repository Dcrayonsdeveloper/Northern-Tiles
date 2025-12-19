#!/bin/bash
set -euo pipefail

# Config
APP_NAME="${APP_NAME:-jikra}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/home/u857927454/domains/jikra.dcrayons.app}"
REPO_URL="${REPO_URL:-}"
BRANCH="${BRANCH:-main}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
PHP_BIN="${PHP_BIN:-/opt/alt/php82/usr/bin/php}"
COMPOSER_BIN="${COMPOSER_BIN:-$PHP_BIN composer.phar}"
RUN_DATA_MIGRATIONS="${RUN_DATA_MIGRATIONS:-0}"
BACKUP_DB="${BACKUP_DB:-0}"

# Paths
RELEASES_DIR="$DEPLOY_ROOT/releases"
SHARED_DIR="$DEPLOY_ROOT/shared"
CURRENT_LINK="$DEPLOY_ROOT/current"
LOCK_FILE="$SHARED_DIR/.deploy.lock"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="$RELEASES_DIR/$TIMESTAMP"
LOG_DIR="$SHARED_DIR/logs"
LOG_FILE="$LOG_DIR/deploy_$TIMESTAMP.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }
die() { log "ERROR: $1"; cleanup_failed; exit 1; }

cleanup_failed() {
    rm -f "$LOCK_FILE"
    [ -d "$RELEASE_DIR" ] && rm -rf "$RELEASE_DIR"
}

health_check() {
    local url="${HEALTH_URL:-https://jikra.dcrayons.app/}"
    local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
    [ "$status" = "200" ]
}

# Init
mkdir -p "$RELEASES_DIR" "$SHARED_DIR" "$LOG_DIR" "$SHARED_DIR/storage" "$SHARED_DIR/backups"
exec > >(tee -a "$LOG_FILE") 2>&1

log "=== Deploy started: $APP_NAME @ $TIMESTAMP ==="

# Lock
[ -f "$LOCK_FILE" ] && die "Deploy already in progress (lock file exists)"
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# Create release
mkdir -p "$RELEASE_DIR"
cd "$RELEASE_DIR"

# Fetch code
if [ -n "$REPO_URL" ]; then
    log "Cloning $BRANCH from $REPO_URL..."
    git clone --depth 1 --branch "$BRANCH" "$REPO_URL" . || die "Git clone failed"
else
    log "Copying from current release..."
    [ -L "$CURRENT_LINK" ] && cp -a "$CURRENT_LINK/." . || die "No repo URL and no current release"
    [ -d ".git" ] && git pull origin "$BRANCH" 2>/dev/null || true
fi

# Symlink shared
log "Linking shared resources..."
rm -rf "$RELEASE_DIR/storage"
ln -sfn "$SHARED_DIR/storage" "$RELEASE_DIR/storage"
ln -sfn "$SHARED_DIR/.env" "$RELEASE_DIR/.env"

# Composer
log "Installing Composer dependencies..."
if [ -f "composer.phar" ]; then
    $PHP_BIN composer.phar install --no-dev --optimize-autoloader --no-interaction || die "Composer failed"
elif command -v composer &>/dev/null; then
    composer install --no-dev --optimize-autoloader --no-interaction || die "Composer failed"
else
    curl -sS https://getcomposer.org/installer | $PHP_BIN
    $PHP_BIN composer.phar install --no-dev --optimize-autoloader --no-interaction || die "Composer failed"
fi

# NPM build
log "Building frontend assets..."
if command -v npm &>/dev/null; then
    npm ci --silent && npm run build || die "NPM build failed"
else
    log "WARN: npm not found, skipping frontend build"
fi

# DB Backup
if [ "$BACKUP_DB" = "1" ]; then
    log "Backing up database..."
    if command -v mysqldump &>/dev/null; then
        source "$SHARED_DIR/.env"
        mysqldump -h"${DB_HOST:-localhost}" -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE" > "$SHARED_DIR/backups/db_$TIMESTAMP.sql" 2>/dev/null || log "WARN: DB backup failed"
    else
        log "WARN: mysqldump not found, skipping backup"
    fi
fi

# Maintenance mode
log "Entering maintenance mode..."
[ -L "$CURRENT_LINK" ] && $PHP_BIN "$CURRENT_LINK/artisan" down --retry=60 2>/dev/null || true

# Schema migrations
log "Running schema migrations..."
$PHP_BIN artisan migrate --force || die "Migration failed"

# Data migrations (optional)
if [ "$RUN_DATA_MIGRATIONS" = "1" ]; then
    log "Running data migrations..."
    $PHP_BIN artisan app:data-migrate --force || die "Data migration failed"
fi

# Optimize
log "Optimizing application..."
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:cache
$PHP_BIN artisan storage:link 2>/dev/null || true
$PHP_BIN artisan queue:restart 2>/dev/null || true

# Switch symlink
PREVIOUS_RELEASE=$(readlink -f "$CURRENT_LINK" 2>/dev/null || echo "")
log "Switching symlink..."
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

# Up
log "Bringing application up..."
$PHP_BIN artisan up

# Health check
log "Running health check..."
sleep 2
if ! health_check; then
    log "Health check failed! Rolling back..."
    if [ -n "$PREVIOUS_RELEASE" ] && [ -d "$PREVIOUS_RELEASE" ]; then
        ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK"
        $PHP_BIN "$CURRENT_LINK/artisan" up 2>/dev/null || true
    fi
    die "Health check failed"
fi

# Cleanup old releases
log "Pruning old releases (keeping $KEEP_RELEASES)..."
cd "$RELEASES_DIR"
ls -1dt */ | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

log "=== Deploy completed successfully ==="
