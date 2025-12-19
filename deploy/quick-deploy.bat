@echo off
setlocal enabledelayedexpansion

:: Quick Deploy Script for Jikra
:: Usage: quick-deploy.bat [--build] [--all]

set ROOT_DIR=%~dp0..
set SSH_HOST=hostinger
set REMOTE_PATH=~/domains/jikra.dcrayons.app/public_html
set PHP_PATH=/opt/alt/php82/usr/bin/lsphp

cd /d "%ROOT_DIR%"

echo.
echo ========================================
echo   JIKRA Quick Deployment
echo ========================================
echo.

:: Check for flags
set DO_BUILD=0
set DEPLOY_ALL=0

:parse_args
if "%~1"=="" goto main
if "%~1"=="--build" set DO_BUILD=1
if "%~1"=="--all" set DEPLOY_ALL=1
shift
goto parse_args

:main

:: Get changed files from git
echo [1/4] Detecting changes...

if "%DEPLOY_ALL%"=="1" (
    echo       Deploying ALL tracked files...
    git ls-files --modified --others --exclude-standard > deploy\changed_files.txt
) else (
    git diff --name-only HEAD > deploy\changed_files.txt
    git ls-files --others --exclude-standard >> deploy\changed_files.txt
)

:: Count changes
set /a COUNT=0
for /f %%a in (deploy\changed_files.txt) do set /a COUNT+=1

if %COUNT%==0 (
    echo       No changes detected.
    if "%DO_BUILD%"=="0" goto end
)

echo       Found %COUNT% changed file(s)

:: Check if build is needed
set NEEDS_BUILD=0
findstr /i "resources\js resources\scss resources\css vite.config tailwind.config package.json" deploy\changed_files.txt >nul 2>&1
if not errorlevel 1 set NEEDS_BUILD=1
if "%DO_BUILD%"=="1" set NEEDS_BUILD=1

:: Build if needed
if "%NEEDS_BUILD%"=="1" (
    echo.
    echo [2/4] Building frontend assets...
    call npm run build
    if errorlevel 1 (
        echo       Build FAILED!
        goto end
    )
    echo       Build completed.

    echo.
    echo [3/4] Uploading build assets...
    powershell -Command "Compress-Archive -Path 'public\build\*' -DestinationPath 'deploy\build.zip' -Force"
    scp deploy\build.zip %SSH_HOST%:%REMOTE_PATH%/
    ssh %SSH_HOST% "cd %REMOTE_PATH% && rm -rf public/build/* && unzip -o build.zip -d public/build/ && rm build.zip"
    del deploy\build.zip
    echo       Build assets uploaded.
) else (
    echo.
    echo [2/4] Skipping build (no frontend changes)
    echo [3/4] Uploading changed files...
)

:: Upload changed PHP and other non-build files
for /f "usebackq delims=" %%f in ("deploy\changed_files.txt") do (
    set "FILE=%%f"
    :: Skip frontend source files if we built
    if "%NEEDS_BUILD%"=="1" (
        echo !FILE! | findstr /i "^resources\js ^resources\scss ^resources\css" >nul
        if errorlevel 1 (
            call :upload_file "!FILE!"
        )
    ) else (
        call :upload_file "!FILE!"
    )
)

echo.
echo [4/4] Clearing caches...
ssh %SSH_HOST% "cd %REMOTE_PATH% && %PHP_PATH% artisan cache:clear && %PHP_PATH% artisan config:clear && %PHP_PATH% artisan view:clear && %PHP_PATH% artisan route:clear" 2>nul
echo       Caches cleared.

:end
echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.

del deploy\changed_files.txt 2>nul
goto :eof

:upload_file
set "FILEPATH=%~1"
if "%FILEPATH%"=="" goto :eof
:: Get directory path
for %%i in ("%FILEPATH%") do set "DIRPATH=%%~dpi"
set "DIRPATH=%DIRPATH:~0,-1%"
set "DIRPATH=%DIRPATH:\=/%"
set "FILEPATH_UNIX=%FILEPATH:\=/%"

:: Create remote directory and upload
ssh %SSH_HOST% "mkdir -p %REMOTE_PATH%/%DIRPATH%" 2>nul
scp "%ROOT_DIR%\%FILEPATH%" %SSH_HOST%:%REMOTE_PATH%/%FILEPATH_UNIX% >nul 2>&1
if errorlevel 1 (
    echo       FAILED: %FILEPATH%
) else (
    echo       Uploaded: %FILEPATH%
)
goto :eof
