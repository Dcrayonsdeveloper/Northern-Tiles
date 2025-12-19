#!/bin/bash
set -euo pipefail

SSH_HOST="${SSH_HOST:-u857927454@89.117.157.226}"
SSH_PORT="${SSH_PORT:-65002}"
SSH_KEY="${SSH_KEY:-~/.ssh/hostinger_key}"
REMOTE_SCRIPT="/home/u857927454/domains/jikra.dcrayons.app/shared/deploy.sh"

# Pass through env vars
ENV_VARS="BRANCH=${BRANCH:-main} RUN_DATA_MIGRATIONS=${RUN_DATA_MIGRATIONS:-0} BACKUP_DB=${BACKUP_DB:-0}"

echo "=== Deploying to $SSH_HOST ==="
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_HOST" "$ENV_VARS bash $REMOTE_SCRIPT"
