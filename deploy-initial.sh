#!/bin/bash
# =============================================================================
# Initial Deployment Script for Hostinger (First Time Setup)
# Application: Jikra E-commerce
# URL: jikra.dcrayons.app
# =============================================================================

set -e

echo "=========================================="
echo "   Initial Laravel Setup - Jikra"
echo "=========================================="

# Configuration - UPDATE THESE!
DEPLOY_PATH="/home/u123456789/domains/jikra.dcrayons.app/public_html"

cd "$DEPLOY_PATH"

# Step 1: Copy environment file
echo "[1/8] Setting up environment file..."
if [ ! -f ".env" ]; then
    cp .env.production .env
    echo "Created .env from .env.production"
    echo "IMPORTANT: Edit .env and update database credentials!"
else
    echo ".env file already exists"
fi

# Step 2: Generate application key
echo "[2/8] Generating application key..."
php artisan key:generate --force

# Step 3: Download Composer if not exists
echo "[3/8] Setting up Composer..."
if [ ! -f "composer.phar" ]; then
    curl -sS https://getcomposer.org/installer | php
fi

# Step 4: Install dependencies
echo "[4/8] Installing Composer dependencies..."
php composer.phar install --no-dev --optimize-autoloader --no-interaction

# Step 5: Run migrations
echo "[5/8] Running database migrations..."
php artisan migrate --force

# Step 6: Run seeders (optional - uncomment if needed)
echo "[6/8] Running database seeders..."
# php artisan db:seed --force
# Uncomment specific seeders you need:
# php artisan db:seed --class=DictionarySeeder --force
# php artisan db:seed --class=HomePageSeeder --force
# php artisan db:seed --class=SettingsSeeder --force

# Step 7: Create storage link
echo "[7/8] Creating storage symlink..."
php artisan storage:link

# Step 8: Cache configuration
echo "[8/8] Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo ""
echo "=========================================="
echo "   Initial Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update .env with your database credentials"
echo "2. Update .env with your mail settings"
echo "3. Set up cron job for Laravel scheduler"
echo "4. Set up queue worker (if using queues)"
echo ""
echo "URL: https://jikra.dcrayons.app"
echo ""
