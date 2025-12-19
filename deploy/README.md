# Jikra Deployment System

Smart deployment system that detects changed files and deploys only what's needed via SSH.

## Prerequisites

- SSH key configured for Hostinger server (already set up in `~/.ssh/config`)
- Node.js and npm installed
- PowerShell (Windows) or Bash (Linux/Mac)

## Quick Start

### Using npm scripts (Recommended)

```bash
# Deploy only changed files (auto-detects if build needed)
npm run deploy

# Force build and deploy
npm run deploy:build

# Deploy all tracked files
npm run deploy:all

# Dry run - see what would be deployed without deploying
npm run deploy:dry
```

### Using PowerShell directly

```powershell
# Basic deployment
.\deploy\Deploy-Jikra.ps1

# Force build
.\deploy\Deploy-Jikra.ps1 -Build

# Deploy all files
.\deploy\Deploy-Jikra.ps1 -All

# Dry run
.\deploy\Deploy-Jikra.ps1 -DryRun
```

## How It Works

1. **Change Detection**: Uses `git diff` to detect modified and untracked files
2. **Smart Build**: Automatically runs `npm run build` if frontend files changed
3. **Efficient Upload**:
   - Creates zip of build assets for faster upload
   - Uploads individual PHP/config files via SCP
4. **Cache Clear**: Automatically clears Laravel caches after deployment

## Files Structure

```
deploy/
  config.json        # Deployment configuration
  Deploy-Jikra.ps1   # Main PowerShell deployment script
  quick-deploy.bat   # Windows batch script alternative
  deploy.js          # Node.js deployment script (requires glob/chokidar)
  README.md          # This file
```

## Configuration

Edit `deploy/config.json` to customize:

```json
{
    "ssh": {
        "host": "hostinger",           // SSH host from ~/.ssh/config
        "remote_path": "~/domains/..." // Remote deployment path
    },
    "php_path": "/opt/alt/php82/...",  // PHP path on server
    "watch_paths": [...],              // File patterns to track
    "ignore_patterns": [...],          // Files to ignore
    "build_triggers": [...],           // Files that trigger npm build
    "post_deploy_commands": [...]      // Laravel artisan commands after deploy
}
```

## SSH Configuration

The SSH config is already set up in `~/.ssh/config`:

```
Host hostinger
    HostName 89.117.157.226
    Port 65002
    User u857927454
    IdentityFile ~/.ssh/hostinger_key
    StrictHostKeyChecking no
```

## Build Triggers

The following file changes automatically trigger `npm run build`:

- `resources/js/**/*`
- `resources/scss/**/*`
- `resources/css/**/*`
- `vite.config.js`
- `tailwind.config.js`
- `package.json`

## Post-Deploy Commands

These Laravel commands run automatically after deployment:

- `php artisan cache:clear`
- `php artisan config:clear`
- `php artisan view:clear`
- `php artisan route:clear`

## Troubleshooting

### SSH Connection Issues
```bash
# Test SSH connection
ssh hostinger "echo 'Connected!'"
```

### PHP Version Issues
The server uses PHP 8.2 at `/opt/alt/php82/usr/bin/lsphp`. If you get version errors, check this path.

### Permission Issues
Ensure SSH key has correct permissions:
```bash
chmod 600 ~/.ssh/hostinger_key
```
