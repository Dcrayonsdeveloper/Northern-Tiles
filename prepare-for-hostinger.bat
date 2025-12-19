@echo off
REM =============================================================================
REM Prepare Laravel Project for Hostinger Upload
REM Application: Jikra E-commerce
REM =============================================================================

echo ==========================================
echo   Preparing Jikra for Hostinger Upload
echo ==========================================
echo.

REM Step 1: Install Node dependencies
echo [1/5] Installing Node dependencies...
call npm install

REM Step 2: Build production assets
echo [2/5] Building production assets...
call npm run build

REM Step 3: Install Composer dependencies (production)
echo [3/5] Installing Composer dependencies...
call composer install --no-dev --optimize-autoloader

REM Step 4: Create deployment folder
echo [4/5] Creating deployment folder...
if exist "deploy" rmdir /s /q "deploy"
mkdir "deploy"

REM Step 5: Copy files to deployment folder
echo [5/5] Copying files to deployment folder...

REM Copy directories
xcopy /E /I /Q "app" "deploy\app"
xcopy /E /I /Q "bootstrap" "deploy\bootstrap"
xcopy /E /I /Q "config" "deploy\config"
xcopy /E /I /Q "database" "deploy\database"
xcopy /E /I /Q "public" "deploy\public"
xcopy /E /I /Q "resources" "deploy\resources"
xcopy /E /I /Q "routes" "deploy\routes"
xcopy /E /I /Q "storage" "deploy\storage"
xcopy /E /I /Q "vendor" "deploy\vendor"

REM Copy files
copy "artisan" "deploy\artisan"
copy "composer.json" "deploy\composer.json"
copy "composer.lock" "deploy\composer.lock"
copy ".env.production" "deploy\.env.production"
copy "deploy.sh" "deploy\deploy.sh"
copy "deploy-initial.sh" "deploy\deploy-initial.sh"

echo.
echo ==========================================
echo   Build Complete!
echo ==========================================
echo.
echo Files ready in: deploy\
echo.
echo Next steps:
echo 1. ZIP the deploy folder
echo 2. Upload to Hostinger via File Manager or FTP
echo 3. Extract files in public_html
echo 4. Rename .env.production to .env
echo 5. Update .env with database credentials
echo 6. Run: php artisan key:generate
echo 7. Run: php artisan migrate --force
echo 8. Run: php artisan storage:link
echo.
pause
