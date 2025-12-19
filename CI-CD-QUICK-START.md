# CI/CD Quick Start Guide (5 Minutes)

## Step 1: Generate SSH Keys

```bash
# Run on your local machine (Windows PowerShell or Git Bash)
ssh-keygen -t rsa -b 4096 -f hostinger_deploy_key -N ""
```

This creates:
- `hostinger_deploy_key` (private) → for GitHub
- `hostinger_deploy_key.pub` (public) → for Hostinger

## Step 2: Add Public Key to Hostinger

1. Login to [Hostinger hPanel](https://hpanel.hostinger.com)
2. Go to **Advanced** → **SSH Access**
3. Click **Manage SSH Keys** or **Add SSH Key**
4. Paste content of `hostinger_deploy_key.pub`
5. Save

## Step 3: Add 5 Secrets to GitHub

Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

Click **"New repository secret"** for each:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `HOSTINGER_SSH_KEY` | Private key content | `cat hostinger_deploy_key` |
| `HOSTINGER_HOST` | Server IP (e.g., `89.117.157.226`) | From hPanel SSH section |
| `HOSTINGER_SSH_PORT` | Port (e.g., `65002`) | From hPanel SSH section |
| `HOSTINGER_SSH_USER` | Username (e.g., `u857927454`) | From hPanel SSH section |
| `HOSTINGER_REMOTE_PATH` | `/home/u857927454/domains/jikra.dcrayons.app/public_html` | SSH to server, run `pwd` |

## Step 4: Deploy!

### Option A: Automatic (on push)
```bash
git add .
git commit -m "Setup CI/CD"
git push origin main
```

### Option B: Manual Trigger
1. Go to GitHub → **Actions**
2. Click **"Deploy to Hostinger"**
3. Click **"Run workflow"**
4. Select branch, click **"Run workflow"**

## Done!

Check deployment: https://github.com/YOUR_USERNAME/YOUR_REPO/actions

---

For detailed setup, see [CI-CD-SETUP.md](./CI-CD-SETUP.md)
