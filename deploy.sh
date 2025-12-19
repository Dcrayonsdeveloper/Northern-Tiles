#!/bin/bash
# =============================================================================
# Laravel Deployment Script for Hostinger
# Application: Jikra E-commerce
# URL: jikra.dcrayons.app
# =============================================================================

set -e

echo "=========================================="
echo "   Laravel Deployment Script - Jikra"
echo "=========================================="

# Configuration
DEPLOY_PATH="/home/u123456789/domains/jikra.dcrayons.app/public_html"
# Update the above path with your actual Hostinger path

# Step 1: Put application in maintenance mode (if already deployed)
if [ -f "$DEPLOY_PATH/artisan" ]; then
    echo "[1/10] Enabling maintenance mode..."
    cd "$DEPLOY_PATH"
    php artisan down --retry=60 || true
fi

# Step 2: Navigate to deployment path
echo "[2/10] Navigating to deployment path..."
cd "$DEPLOY_PATH"

# Step 3: Pull latest changes from Git (if using Git deployment)
if [ -d ".git" ]; then
    echo "[3/10] Pulling latest changes from Git..."
    git pull origin main
else
    echo "[3/10] Skipping Git pull (not a Git repository)..."
fi

# Step 4: Install Composer dependencies
echo "[4/10] Installing Composer dependencies..."
php composer.phar install --no-dev --optimize-autoloader --no-interaction

# Step 5: Run database migrations
echo "[5/10] Running database migrations..."
php artisan migrate --force

# Step 6: Clear and rebuild caches
echo "[6/10] Clearing caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

echo "[7/10] Rebuilding caches for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Step 8: Create storage link (if not exists)
echo "[8/10] Creating storage symlink..."
php artisan storage:link || true

# Step 9: Set proper permissions
echo "[9/10] Setting file permissions..."
find storage -type d -exec chmod 755 {} \;
find storage -type f -exec chmod 644 {} \;
find bootstrap/cache -type d -exec chmod 755 {} \;
find bootstrap/cache -type f -exec chmod 644 {} \;

# Step 10: Disable maintenance mode
echo "[10/10] Disabling maintenance mode..."
php artisan up

echo ""
echo "=========================================="
echo "   Deployment Complete!"
echo "=========================================="
echo "URL: https://jikra.dcrayons.app"
echo ""
