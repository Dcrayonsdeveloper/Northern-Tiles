# Deployment Guide for Hostinger

## Application: Jikra E-commerce
## URL: https://jikra.dcrayons.app

---

## Prerequisites

Before deploying, ensure you have:
1. Hostinger hosting account with PHP 8.2+ support
2. MySQL database created in Hostinger hPanel
3. Domain/subdomain (jikra.dcrayons.app) pointed to your hosting
4. SSH access enabled (optional but recommended)
5. Build assets locally before uploading

---

## Step 1: Build Assets Locally

Run these commands on your local machine before uploading:

```bash
# Install Node dependencies and build for production
npm install
npm run build
```

This creates the `public/build` folder with compiled CSS/JS.

---

## Step 2: Prepare Files for Upload

### Files/Folders to Upload:

```
app/
bootstrap/
config/
database/
public/
resources/
routes/
storage/
vendor/              (or install via Composer on server)
.env.production      (rename to .env after upload)
artisan
composer.json
composer.lock
```

### Files to EXCLUDE:

```
node_modules/        (not needed in production)
.git/                (unless using Git deployment)
tests/
.env                 (local config - don't upload!)
.env.example
*.md (optional)
```

---

## Step 3: Create MySQL Database

1. Login to Hostinger hPanel
2. Go to **Databases** > **MySQL Databases**
3. Create a new database (e.g., `u123456789_jikra`)
4. Note down:
   - Database name
   - Database user
   - Database password
   - Host (usually `localhost`)

---

## Step 4: Upload Files

### Option A: File Manager (Simple)

1. Login to Hostinger hPanel
2. Go to **Files** > **File Manager**
3. Navigate to `public_html` (or your domain folder)
4. Upload a ZIP of your project
5. Extract the ZIP

### Option B: FTP (Recommended for large projects)

1. Get FTP credentials from hPanel
2. Use FileZilla or similar FTP client
3. Upload all files to `public_html`

### Option C: Git Deployment (Advanced)

1. SSH into your server
2. Clone your repository:
```bash
cd /home/u123456789/domains/jikra.dcrayons.app/public_html
git clone https://github.com/your-repo.git .
```

---

## Step 5: Configure Environment

1. Rename `.env.production` to `.env`
2. Edit `.env` and update:

```env
APP_KEY=               # Will be generated
APP_URL=https://jikra.dcrayons.app

DB_DATABASE=u123456789_jikra
DB_USERNAME=u123456789_jikra
DB_PASSWORD=your_actual_password

MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=your_email@jikra.dcrayons.app
MAIL_PASSWORD=your_email_password
MAIL_ENCRYPTION=ssl
```

---

## Step 6: Server Configuration

### 6.1 Create/Edit .htaccess

Hostinger should auto-detect Laravel, but if needed, ensure `public/.htaccess` exists:

```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

### 6.2 Document Root Configuration

If your files are in `/public_html` directly (not `/public_html/public`), you need to either:

**Option A: Move public contents (Recommended)**
- Move contents of `public/` to `public_html/`
- Update paths in `index.php`:

```php
// Change this:
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

// To this:
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
```

**Option B: Set Document Root (if Hostinger allows)**
- In hPanel, set document root to `public_html/public`

---

## Step 7: Run Artisan Commands

### Via SSH (Recommended):

```bash
# Navigate to project
cd /home/u123456789/domains/jikra.dcrayons.app/public_html

# Download Composer
curl -sS https://getcomposer.org/installer | php

# Install dependencies (if not uploaded vendor/)
php composer.phar install --no-dev --optimize-autoloader

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Create storage link
php artisan storage:link

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run seeders (if needed)
php artisan db:seed --class=DictionarySeeder --force
php artisan db:seed --class=HomePageSeeder --force
php artisan db:seed --class=SettingsSeeder --force
```

### Via Hostinger PHP Task (if no SSH):

1. Go to hPanel > **Advanced** > **Cron Jobs**
2. Create a one-time task with:
```bash
cd /home/u123456789/domains/jikra.dcrayons.app/public_html && php artisan migrate --force
```

---

## Step 8: Set Up Cron Jobs

Laravel needs a scheduler to run. In Hostinger hPanel:

1. Go to **Advanced** > **Cron Jobs**
2. Add this cron job (runs every minute):

```
* * * * * cd /home/u123456789/domains/jikra.dcrayons.app/public_html && php artisan schedule:run >> /dev/null 2>&1
```

---

## Step 9: Set Up Queue Worker (Optional)

For background jobs (emails, abandoned cart detection), you need a queue worker.

### Option A: Supervisor (if available)

Create `/etc/supervisor/conf.d/jikra-worker.conf`:

```ini
[program:jikra-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /home/u123456789/domains/jikra.dcrayons.app/public_html/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=u123456789
numprocs=1
redirect_stderr=true
stdout_logfile=/home/u123456789/logs/worker.log
```

### Option B: Cron Job (Simpler)

Add a cron job to run queue worker:

```
*/5 * * * * cd /home/u123456789/domains/jikra.dcrayons.app/public_html && php artisan queue:work --stop-when-empty >> /dev/null 2>&1
```

---

## Step 10: SSL Certificate

Hostinger usually provides free SSL. Enable it in:

1. hPanel > **Security** > **SSL**
2. Install free SSL certificate
3. Enable "Force HTTPS"

---

## Step 11: Verify Deployment

1. Visit https://jikra.dcrayons.app
2. Check that:
   - Home page loads with hero banner
   - Admin panel works (/admin)
   - Forms submit correctly
   - Images display properly

---

## Troubleshooting

### 500 Error
- Check `storage/logs/laravel.log`
- Ensure storage permissions: `chmod -R 775 storage bootstrap/cache`
- Verify `.env` database credentials

### Assets Not Loading
- Ensure `npm run build` was run locally
- Check `public/build` folder exists
- Verify `.htaccess` is correct

### Database Connection Error
- Verify database credentials in `.env`
- Check if database exists in hPanel
- Try `localhost` or `127.0.0.1` for DB_HOST

### Storage Link Error
- Run `php artisan storage:link` manually
- Or create symlink: `ln -s ../storage/app/public public/storage`

---

## Update Deployment

For subsequent updates:

```bash
# Via SSH
cd /home/u123456789/domains/jikra.dcrayons.app/public_html
php artisan down
git pull origin main  # if using Git
php composer.phar install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan cache:clear
php artisan up
```

Or use the provided `deploy.sh` script.

---

## Important Paths

| Item | Local | Production |
|------|-------|------------|
| Project Root | `D:\Projects\laravel-internal\laravel-app` | `/home/u123456789/domains/jikra.dcrayons.app/public_html` |
| Public | `public/` | `public_html/` (or `public_html/public/`) |
| Storage | `storage/` | `/public_html/storage` |
| Logs | `storage/logs/` | `/public_html/storage/logs/` |

---

## Support Contacts

- Hostinger Support: https://support.hostinger.com
- Laravel Docs: https://laravel.com/docs

---

Last Updated: December 2025
