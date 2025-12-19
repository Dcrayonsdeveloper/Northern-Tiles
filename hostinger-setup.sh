#!/bin/bash
# Hostinger Setup Script - Run this on the server
# Upload this file and execute: bash hostinger-setup.sh

cd ~/domains/jikra.dcrayons.app/public_html

echo "=== Step 1: Moving public folder contents ==="
mv public/.htaccess . 2>/dev/null || true
mv public/* . 2>/dev/null || true
rm -rf public

echo "=== Step 2: Updating index.php paths ==="
sed -i "s|__DIR__.'/../vendor|__DIR__.'/vendor|g" index.php
sed -i "s|__DIR__.'/../bootstrap|__DIR__.'/bootstrap|g" index.php

echo "=== Step 3: Setting permissions ==="
chmod -R 755 storage bootstrap/cache
chmod 644 .env

echo "=== Step 4: Generating app key ==="
php artisan key:generate --force

echo "=== Step 5: Creating storage link ==="
php artisan storage:link

echo "=== Step 6: Caching config ==="
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "=== Setup Complete! ==="
echo "Now update .env with database credentials and run:"
echo "php artisan migrate --force"
echo "php artisan db:seed --class=DictionarySeeder --force"
echo "php artisan db:seed --class=HomePageSeeder --force"
