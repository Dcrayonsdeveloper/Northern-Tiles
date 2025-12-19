<#
.SYNOPSIS
    Smart deployment script for Jikra Laravel application.

.DESCRIPTION
    Detects changed files, builds frontend if needed, and deploys via SSH.

.PARAMETER Build
    Force frontend build even if no frontend files changed.

.PARAMETER All
    Deploy all files, not just changed ones.

.PARAMETER DryRun
    Show what would be deployed without actually deploying.

.PARAMETER Seed
    Run database seeders after deployment.

.EXAMPLE
    .\Deploy-Jikra.ps1
    Deploy only changed files.

.EXAMPLE
    .\Deploy-Jikra.ps1 -Build
    Force build and deploy.

.EXAMPLE
    .\Deploy-Jikra.ps1 -Seed
    Deploy and run seeders.
#>

param(
    [switch]$Build,
    [switch]$All,
    [switch]$DryRun,
    [switch]$Seed
)

# Configuration
$Script:SshHost = "hostinger"
$Script:RemotePath = "~/domains/jikra.dcrayons.app/public_html"
$Script:PhpPath = "/opt/alt/php82/usr/bin/lsphp"
$Script:RootDir = Split-Path -Parent $PSScriptRoot

# Build triggers
$Script:BuildTriggers = @(
    "resources/js/*",
    "resources/scss/*",
    "resources/css/*",
    "vite.config.js",
    "tailwind.config.js",
    "package.json"
)

# Files to ignore
$Script:IgnorePatterns = @(
    "node_modules/*",
    "vendor/*",
    ".git/*",
    "storage/logs/*",
    "storage/framework/*",
    "deploy/*",
    ".env",
    "*.log",
    ".claude/*"
)

function Write-Step($Step, $Message) {
    Write-Host "[$Step] " -ForegroundColor Cyan -NoNewline
    Write-Host $Message
}

function Write-Ok($Message) {
    Write-Host "[OK] " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-Fail($Message) {
    Write-Host "[FAIL] " -ForegroundColor Red -NoNewline
    Write-Host $Message
}

function Write-Warn($Message) {
    Write-Host "[WARN] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

# Get changed files using git
function Get-ChangedFiles {
    param([switch]$AllFiles)

    Push-Location $Script:RootDir

    $files = @()

    if ($AllFiles) {
        $gitFiles = git ls-files 2>$null
        $files = $gitFiles | Where-Object { $_ }
    } else {
        $modified = git diff --name-only HEAD 2>$null
        $untracked = git ls-files --others --exclude-standard 2>$null
        $files = @($modified) + @($untracked) | Where-Object { $_ } | Select-Object -Unique
    }

    # Filter out ignored patterns
    $filtered = $files | Where-Object {
        $file = $_
        $ignore = $false
        foreach ($pattern in $Script:IgnorePatterns) {
            if ($file -like $pattern) {
                $ignore = $true
                break
            }
        }
        -not $ignore
    }

    Pop-Location
    return $filtered
}

# Check if any files trigger a build
function Test-NeedsBuild($Files) {
    foreach ($file in $Files) {
        foreach ($trigger in $Script:BuildTriggers) {
            if ($file -like $trigger) {
                return $true
            }
        }
    }
    return $false
}

# Run npm build
function Invoke-Build {
    Write-Step "BUILD" "Building frontend assets..."

    Push-Location $Script:RootDir
    try {
        $result = & npm run build 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Build failed!"
            Write-Host $result -ForegroundColor Red
            Pop-Location
            return $false
        }
        Write-Ok "Build completed"
        Pop-Location
        return $true
    } catch {
        Write-Fail "Build failed: $_"
        Pop-Location
        return $false
    }
}

# Upload build assets one by one
function Send-BuildAssets {
    Write-Step "UPLOAD" "Uploading build assets..."

    $buildDir = Join-Path $Script:RootDir "public\build"
    $assetsDir = Join-Path $buildDir "assets"

    try {
        # Clear remote build directory first
        & ssh $Script:SshHost "rm -rf ${Script:RemotePath}/public/build/*" 2>$null

        # Upload manifest.json
        $manifest = Join-Path $buildDir "manifest.json"
        if (Test-Path $manifest) {
            & scp "$manifest" "${Script:SshHost}:${Script:RemotePath}/public/build/" 2>$null
            Write-Host "  Uploaded: manifest.json" -ForegroundColor Gray
        }

        # Create assets directory on remote
        & ssh $Script:SshHost "mkdir -p ${Script:RemotePath}/public/build/assets" 2>$null

        # Upload each asset file
        $assetFiles = Get-ChildItem -Path $assetsDir -File
        $count = 0
        foreach ($file in $assetFiles) {
            & scp "$($file.FullName)" "${Script:SshHost}:${Script:RemotePath}/public/build/assets/" 2>$null
            $count++
            if ($count % 10 -eq 0) {
                Write-Host "  Uploaded $count/$($assetFiles.Count) assets..." -ForegroundColor Gray
            }
        }

        Write-Ok "Build assets uploaded ($count files)"
        return $true
    } catch {
        Write-Fail "Failed to upload build: $_"
        return $false
    }
}

# Upload a single file
function Send-File($LocalPath) {
    $fullPath = Join-Path $Script:RootDir $LocalPath
    $remotePath = $LocalPath -replace '\\', '/'
    $remoteDir = Split-Path $remotePath -Parent

    if (-not (Test-Path $fullPath)) {
        return $false
    }

    try {
        # Create remote directory
        & ssh $Script:SshHost "mkdir -p ${Script:RemotePath}/$remoteDir" 2>$null

        # Upload file
        & scp "$fullPath" "${Script:SshHost}:${Script:RemotePath}/$remotePath" 2>$null

        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

# Upload multiple files
function Send-Files($Files) {
    $uploaded = 0
    $failed = 0

    foreach ($file in $Files) {
        Write-Host "  Uploading $file... " -NoNewline
        if ($DryRun) {
            Write-Host "(DRY RUN)" -ForegroundColor Yellow
            $uploaded++
        } elseif (Send-File $file) {
            Write-Host "OK" -ForegroundColor Green
            $uploaded++
        } else {
            Write-Host "FAIL" -ForegroundColor Red
            $failed++
        }
    }

    return @{ Uploaded = $uploaded; Failed = $failed }
}

# Clear Laravel caches
function Clear-LaravelCaches {
    Write-Step "CACHE" "Clearing Laravel caches..."

    if ($DryRun) {
        Write-Host "  (DRY RUN) Would clear caches" -ForegroundColor Yellow
        return $true
    }

    $commands = @("cache:clear", "config:clear", "view:clear", "route:clear")

    foreach ($cmd in $commands) {
        try {
            & ssh $Script:SshHost "cd ${Script:RemotePath}; ${Script:PhpPath} artisan $cmd" 2>$null
        } catch {
            # Continue even if one fails
        }
    }

    Write-Ok "Caches cleared"
    return $true
}

# Run database seeders
function Invoke-Seeders {
    Write-Step "SEED" "Running database seeders..."

    if ($DryRun) {
        Write-Host "  (DRY RUN) Would run seeders" -ForegroundColor Yellow
        return $true
    }

    try {
        & ssh $Script:SshHost "cd ${Script:RemotePath}; ${Script:PhpPath} artisan db:seed --class=DictionarySeeder --force" 2>$null
        Write-Ok "Dictionary seeder completed"
        return $true
    } catch {
        Write-Fail "Seeder failed: $_"
        return $false
    }
}

# Main deployment function
function Invoke-Deploy {
    $startTime = Get-Date

    Write-Host ""
    Write-Host "=== JIKRA Deployment ===" -ForegroundColor White
    Write-Host "========================"

    # Get changed files
    Write-Step "SCAN" "Detecting changed files..."
    $changedFiles = Get-ChangedFiles -AllFiles:$All

    if ($changedFiles.Count -eq 0 -and -not $Build -and -not $Seed) {
        Write-Ok "No changes detected. Nothing to deploy."
        return
    }

    Write-Host "  Found $($changedFiles.Count) changed file(s)" -ForegroundColor Yellow

    # Check if build needed
    $needsBuild = $Build -or (Test-NeedsBuild $changedFiles)

    if ($needsBuild) {
        if (-not $DryRun) {
            if (-not (Invoke-Build)) {
                Write-Fail "Deployment aborted due to build failure"
                return
            }
        } else {
            Write-Host "  (DRY RUN) Would run npm build" -ForegroundColor Yellow
        }
    }

    # Filter files for upload (exclude frontend source if built)
    $filesToUpload = $changedFiles
    if ($needsBuild) {
        $filesToUpload = $changedFiles | Where-Object {
            -not ($_ -like "resources/js/*" -or $_ -like "resources/scss/*" -or $_ -like "resources/css/*")
        }
    }

    # Upload build if needed
    if ($needsBuild -and -not $DryRun) {
        Send-BuildAssets
    }

    # Upload changed files
    if ($filesToUpload.Count -gt 0) {
        Write-Step "UPLOAD" "Uploading $($filesToUpload.Count) file(s)..."
        $result = Send-Files $filesToUpload

        if ($result.Failed -gt 0) {
            Write-Warn "$($result.Failed) file(s) failed to upload"
        }
        Write-Ok "$($result.Uploaded) file(s) uploaded"
    }

    # Clear caches
    Clear-LaravelCaches

    # Run seeders if requested
    if ($Seed) {
        Invoke-Seeders
    }

    $duration = ((Get-Date) - $startTime).TotalSeconds
    Write-Host "========================"
    Write-Ok "Deployment completed in $([math]::Round($duration, 1))s"
    Write-Host ""
}

# Run
Invoke-Deploy
