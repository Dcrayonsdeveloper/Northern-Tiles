# CI/CD Pipeline Setup for Hostinger Deployment

Complete guide for setting up automated deployments from GitHub to Hostinger.

## Overview

This CI/CD pipeline automatically:
- Builds Laravel + React application
- Compiles frontend assets with Vite
- Deploys to Hostinger via SSH
- Clears Laravel caches
- Optionally runs migrations and seeders

## Architecture

```
┌─────────────────┐
│   Git Push      │
│   to main       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   GitHub Actions                │
│                                 │
│   BUILD JOB:                    │
│   1. Checkout code              │
│   2. Setup PHP 8.2              │
│   3. Setup Node.js 20           │
│   4. Install Composer deps      │
│   5. Install NPM deps           │
│   6. Build assets (npm run build│
│   7. Create deployment package  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   DEPLOY JOB:                   │
│   1. Download artifact          │
│   2. Setup SSH connection       │
│   3. Upload to Hostinger        │
│   4. Extract files              │
│   5. Set permissions            │
│   6. Clear Laravel caches       │
│   7. (Optional) Run migrations  │
│   8. (Optional) Run seeders     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   Live Site     │
│   Updated!      │
└─────────────────┘
```

## Prerequisites

- GitHub repository with your Laravel project
- Hostinger hosting account with SSH access
- Domain configured in Hostinger

## Setup Instructions

### 1. Generate SSH Key Pair

On your local machine, generate a new SSH key pair specifically for deployments:

```bash
# Windows (PowerShell or Git Bash)
ssh-keygen -t rsa -b 4096 -f hostinger_deploy_key -N ""

# Linux/Mac
ssh-keygen -t rsa -b 4096 -f ~/.ssh/hostinger_deploy_key -N ""
```

This creates two files:
- `hostinger_deploy_key` - Private key (keep secret!)
- `hostinger_deploy_key.pub` - Public key (add to Hostinger)

### 2. Add Public Key to Hostinger

1. Log in to [Hostinger hPanel](https://hpanel.hostinger.com)
2. Select your hosting plan
3. Go to **Advanced** → **SSH Access**
4. If SSH is disabled, enable it first
5. Click **"Manage SSH Keys"** or **"Add SSH Key"**
6. Paste the content of `hostinger_deploy_key.pub`
7. Click **Save**

### 3. Get Hostinger SSH Details

From the SSH Access page in hPanel, note down:
- **Host/IP**: e.g., `89.117.157.226`
- **Port**: e.g., `65002`
- **Username**: e.g., `u857927454`

To get the remote path:
```bash
ssh -p 65002 u857927454@89.117.157.226
pwd
# Output: /home/u857927454/domains/jikra.dcrayons.app/public_html
```

### 4. Add GitHub Secrets

Go to your GitHub repository:
`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add these 5 secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `HOSTINGER_SSH_KEY` | Private key content | `-----BEGIN RSA PRIVATE KEY-----...` |
| `HOSTINGER_HOST` | Server IP address | `89.117.157.226` |
| `HOSTINGER_SSH_PORT` | SSH port | `65002` |
| `HOSTINGER_SSH_USER` | SSH username | `u857927454` |
| `HOSTINGER_REMOTE_PATH` | Full path to public_html | `/home/u857927454/domains/jikra.dcrayons.app/public_html` |

**Important:** For `HOSTINGER_SSH_KEY`, paste the ENTIRE content of the private key file, including the `-----BEGIN` and `-----END` lines.

### 5. Create GitHub Actions Workflow

The workflow file should already exist at:
`.github/workflows/deploy-hostinger.yml`

If not, create it with the content from this repository.

### 6. Test the Pipeline

#### Automatic Deployment (on push):
```bash
git add .
git commit -m "Setup CI/CD pipeline"
git push origin main
```

#### Manual Deployment:
1. Go to GitHub → **Actions** tab
2. Click **"Deploy to Hostinger"** workflow
3. Click **"Run workflow"** dropdown
4. Select branch and options
5. Click **"Run workflow"** button

## Workflow Features

### Automatic Triggers
- Push to `main` or `master` branch

### Manual Triggers
- Run from GitHub Actions UI
- Optional: Run database migrations
- Optional: Run database seeders

### Build Process
- PHP 8.2 environment
- Node.js 20 for frontend build
- Composer dependencies (production only)
- NPM dependencies with caching
- Vite build for React assets

### Deployment Process
- Secure SSH connection
- Compressed archive transfer
- Automatic cache clearing
- Permission setting

## Troubleshooting

### SSH Connection Failed
```
Permission denied (publickey)
```
**Solution:**
- Verify the public key is correctly added to Hostinger
- Check that the private key in GitHub secrets is complete
- Ensure SSH is enabled in Hostinger hPanel

### Build Failed - PHP Version
```
Your Composer dependencies require PHP >= 8.2
```
**Solution:** The workflow uses PHP 8.2. If Hostinger has older PHP, you may need to update PHP version in hPanel.

### Build Failed - Node/NPM
```
npm ERR! ...
```
**Solution:**
- Check `package-lock.json` is committed
- Clear npm cache: Delete `node_modules` and `package-lock.json`, then `npm install`

### Deployment Timeout
**Solution:**
- Large files may timeout. Exclude unnecessary files in the tar command
- Check Hostinger server resources

### Permission Errors on Server
```
Permission denied
```
**Solution:** SSH to server and fix permissions:
```bash
chmod -R 755 storage bootstrap/cache
chmod 644 .env
```

## Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets only
2. **Use separate deploy key** - Don't use your personal SSH key
3. **Limit key permissions** - The deploy key should only have access to the deployment directory
4. **Review workflow changes** - Require PR reviews for changes to `.github/workflows/`
5. **Use environment protection** - Enable required reviewers for production environment

## Monitoring Deployments

### View Deployment Status
- GitHub Actions: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
- Each workflow run shows detailed logs

### Get Notifications
- GitHub sends email on workflow failure
- Set up Slack/Discord notifications with additional actions

### Deployment History
- All deployments are logged in GitHub Actions
- Each run shows commit, timestamp, and status

## Advanced Configuration

### Adding Database Migrations

To run migrations automatically, use manual trigger with `run_migrations: true`, or modify the workflow to always run:

```yaml
- name: Run migrations
  run: |
    ssh -i ~/.ssh/deploy_key -p ${{ secrets.HOSTINGER_SSH_PORT }} \
      ${{ secrets.HOSTINGER_SSH_USER }}@${{ secrets.HOSTINGER_HOST }} \
      "cd ${{ secrets.HOSTINGER_REMOTE_PATH }} && php artisan migrate --force"
```

### Environment-Specific Deployments

Create separate workflows for staging/production:
- `deploy-staging.yml` - triggers on `develop` branch
- `deploy-production.yml` - triggers on `main` branch

### Rollback Strategy

For quick rollback, keep previous deployment:
```yaml
- name: Backup current deployment
  run: |
    ssh ... "cd ${{ secrets.HOSTINGER_REMOTE_PATH }} && \
      tar -czf ../backup-$(date +%Y%m%d-%H%M%S).tar.gz ."
```

## Files Reference

```
.github/
└── workflows/
    └── deploy-hostinger.yml    # Main deployment workflow

CI-CD-SETUP.md                  # This file (detailed guide)
CI-CD-QUICK-START.md            # Quick reference guide
```

## Support

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Hostinger SSH Guide:** https://support.hostinger.com/en/articles/1583245
- **Laravel Deployment:** https://laravel.com/docs/deployment
