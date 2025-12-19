#!/bin/bash
set -euo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-/home/u857927454/domains/jikra.dcrayons.app}"
PHP_BIN="${PHP_BIN:-/opt/alt/php82/usr/bin/php}"
RELEASES_DIR="$DEPLOY_ROOT/releases"
CURRENT_LINK="$DEPLOY_ROOT/current"
LOG_FILE="$DEPLOY_ROOT/shared/logs/rollback_$(date +%Y%m%d_%H%M%S).log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

log "=== Rollback started ==="

CURRENT=$(readlink -f "$CURRENT_LINK" 2>/dev/null)
RELEASES=($(ls -1dt "$RELEASES_DIR"/*/ 2>/dev/null))

[ ${#RELEASES[@]} -lt 2 ] && { log "ERROR: No previous release to rollback to"; exit 1; }

PREVIOUS="${RELEASES[1]}"
log "Current: $CURRENT"
log "Rolling back to: $PREVIOUS"

$PHP_BIN "$CURRENT/artisan" down --retry=60 2>/dev/null || true

ln -sfn "$PREVIOUS" "$CURRENT_LINK"

$PHP_BIN "$CURRENT_LINK/artisan" config:cache
$PHP_BIN "$CURRENT_LINK/artisan" route:cache
$PHP_BIN "$CURRENT_LINK/artisan" view:cache
$PHP_BIN "$CURRENT_LINK/artisan" queue:restart 2>/dev/null || true
$PHP_BIN "$CURRENT_LINK/artisan" up

log "=== Rollback completed ==="
