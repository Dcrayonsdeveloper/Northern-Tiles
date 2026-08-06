# Production Deployment Runbook — Northern TILE Distributors

Authoritative guide for deploying to Hostinger or AWS. Supersedes
`DEPLOYMENT.md`, `CI-CD-SETUP.md` and `PRODUCTION_UPDATE_SUMMARY.md`, which
describe an older, unsafe process.

---

## 1. Safety model

Every deployment path in this repo now follows the same order:

```
back up  ->  stage new release  ->  migrate (opt-in)  ->  warm caches
         ->  atomic symlink swap  ->  health check  ->  auto-rollback on failure
```

Guarantees:

| Guarantee | How it is enforced |
|---|---|
| No data loss | `migrate:fresh`, `migrate:refresh` and `db:wipe` appear nowhere in any deploy path. Migrations are additive and opt-in. |
| Backup before every change | The deploy aborts if `scripts/db-backup.sh` fails. Production is untouched. |
| Uploads survive | `storage/` is a shared directory symlinked into each release; it is excluded from the artifact. |
| Credentials survive | `.env` lives in `shared/` and is never shipped by CI. Build fails if `.env` is in the artifact. |
| No half-deployed state | Releases go live via an atomic symlink swap, not by extracting over a live directory. |
| Bad release self-heals | A failed `/up` health check rolls the symlink back automatically. |

### Server layout

```
<base>/
├── current -> releases/20260806-120000-<sha>   # atomic symlink = live release
├── releases/
│   ├── 20260806-120000-<sha>/                  # newest 5 kept
│   └── ...
└── shared/                                     # survives every deploy
    ├── .env                                    # production credentials (chmod 600)
    └── storage/
        ├── app/public/                         # uploaded images and PDFs
        ├── backups/                            # database backups (chmod 700)
        └── logs/
```

Point the domain's document root at **`<base>/current/public`**.

---

## 2. First-time server setup

```bash
# 1. Create the shared layout (safe to re-run; never overwrites .env)
bash hostinger-setup.sh /home/uXXXXXXXX/domains/ntiled.com.au

# 2. Fill in credentials
nano /home/uXXXXXXXX/domains/ntiled.com.au/shared/.env      # use .env.production.example
chmod 600 /home/uXXXXXXXX/domains/ntiled.com.au/shared/.env

# 3. Import the database (upload the dump over SFTP — never over HTTP)
mysql -u <user> -p <database> < northentiles.sql
rm northentiles.sql        # do not leave dumps on the server

# 4. Upload existing images to shared storage
#    -> shared/storage/app/public/

# 5. Point the document root at <base>/current/public in hPanel
#    Websites -> Manage -> Advanced -> Change document root

# 6. Deploy (GitHub Actions -> "Deploy to Hostinger" -> run_migrations: true)

# 7. Install cron entries (section 4) and verify
cd <base>/current && bash scripts/preflight-check.sh
```

### APP_KEY — read before you touch it

`APP_KEY` encrypts sessions, cookies and any encrypted columns.

* **Brand-new install** → `php artisan key:generate --force`
* **Existing site with data** → copy the existing key across **verbatim**

Regenerating it on a site that already has data logs out every user and makes
existing encrypted values permanently unreadable. Keep an offline copy.

---

## 3. Routine deploys

**GitHub Actions → "Deploy to Hostinger" → Run workflow.**

| Input | Set it to |
|---|---|
| `run_migrations` | `true` only when the release adds migrations |
| `run_seeders` | `false` — see the warning below |
| `seeder_class` | a single class name, if you must seed |

> **Seeders overwrite live data.** `MenuSeeder` deletes every row in
> `menu_items` and `menus` before reinserting. `SettingsSeeder` and
> `CMSSeeder` overwrite existing records. Never run the full `DatabaseSeeder`
> against production once the site is live — it also creates a
> `test@example.com` admin with the password `password`.

Manual fallback, if Actions is unavailable:

```bash
ssh <user>@<host>
bash <base>/current/deploy.sh <base>            # no migrations
bash <base>/current/deploy.sh <base> --migrate  # with migrations
```

---

## 4. Cron and background jobs

The app defines scheduled work in `routes/console.php` (abandoned-cart
detection every 10 min, abandoned-cart emails every 5 min, collection reindex
daily at 02:00) and dispatches queued jobs. **Neither runs without the entries
below.** Add them in hPanel → Advanced → Cron Jobs.

```cron
# Laravel scheduler — required for abandoned-cart emails and reindexing
* * * * * cd /home/uXXXXXXXX/domains/ntiled.com.au/current && /usr/bin/php8.2 artisan schedule:run >> /dev/null 2>&1

# Queue worker — required for ALL queued jobs and outbound email.
# --max-time=3600 makes the worker exit after an hour; the next cron tick
# restarts it. That bounds memory use and picks up new code after a deploy.
* * * * * cd /home/uXXXXXXXX/domains/ntiled.com.au/current && /usr/bin/php8.2 artisan queue:work --stop-when-empty --max-time=3600 --tries=3 --backoff=60 >> storage/logs/queue.log 2>&1

# Nightly database backup, 03:00, 14-day rotation
0 3 * * * cd /home/uXXXXXXXX/domains/ntiled.com.au/current && bash scripts/db-backup.sh nightly >> storage/logs/backup.log 2>&1
```

On AWS use systemd instead of cron for the worker, so it restarts on crash:

```ini
# /etc/systemd/system/ntiled-queue.service
[Unit]
Description=Northern Tiles queue worker
After=network.target mysql.service

[Service]
User=www-data
Restart=always
RestartSec=5
WorkingDirectory=/var/www/ntiled/current
ExecStart=/usr/bin/php artisan queue:work --tries=3 --backoff=60 --max-time=3600

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now ntiled-queue
```

After every deploy the workflow runs `php artisan queue:restart` so workers
pick up new code. Workers keep old code in memory otherwise.

---

## 5. Backup and restore

```bash
bash scripts/db-backup.sh                 # ad-hoc
bash scripts/db-backup.sh pre-deploy      # tagged

bash scripts/db-restore.sh storage/backups/<file>.sql.gz            # dry run
bash scripts/db-restore.sh storage/backups/<file>.sql.gz --confirm  # execute
```

`db-backup.sh` uses `--single-transaction`, so the site stays online during the
dump. It verifies the archive (gzip integrity, `Dump completed` marker,
`CREATE TABLE` count) and exits non-zero if any check fails — so a deploy that
depends on it cannot proceed on a bad backup. Keeps the newest 14.

`db-restore.sh` refuses corrupt or truncated archives and always takes a safety
backup of the current database before overwriting, so a wrong restore is itself
reversible.

**Backups live inside `shared/storage/backups` on the same server.** That
protects against bad deploys and bad migrations, not against losing the server.
Pull a copy off-box regularly:

```bash
scp -P <port> <user>@<host>:'<base>/shared/storage/backups/*.sql.gz' ./local-backups/
```

---

## 6. Rollback

### 6a. Code only — bad release, database unchanged

Fastest path. The health check does this automatically on failure; this is the
manual form.

```bash
ssh <user>@<host>
cd <base>
ls -1t releases/                        # pick the previous release
ln -sfn "$PWD/releases/<previous>" current.tmp && mv -Tf current.tmp current
cd current && php artisan queue:restart
curl -I https://ntiled.com.au/up        # expect 200
```

Takes about a second. Nothing is deleted — the bad release stays in
`releases/` for inspection.

### 6b. Code + database — a migration caused the problem

```bash
ssh <user>@<host>
cd <base>/current

# 1. Take the site down so nothing writes mid-restore
php artisan down --retry=60

# 2. Restore the pre-deploy backup (dry run first)
bash scripts/db-restore.sh storage/backups/<db>_pre-deploy_<stamp>.sql.gz
bash scripts/db-restore.sh storage/backups/<db>_pre-deploy_<stamp>.sql.gz --confirm

# 3. Swap the code back to the matching release
cd <base>
ln -sfn "$PWD/releases/<previous>" current.tmp && mv -Tf current.tmp current

# 4. Clear caches, bring it back up
cd current
php artisan optimize:clear && php artisan optimize
php artisan up
bash scripts/preflight-check.sh
```

Restore the backup taken **immediately before** the failed deploy — the deploy
workflow always writes one, tagged `pre-deploy`.

### 6c. Uploaded files

Uploads live in `shared/storage/app/public` and are never touched by a deploy,
so a rollback does not affect them. If files were deleted by application
activity, restore them from your off-box copy.

---

## 7. Post-deploy verification

```bash
cd <base>/current && bash scripts/preflight-check.sh
```

Checks environment flags, permissions, web-root exposure, DB connectivity,
pending migrations, backup freshness and integrity, asset-layout consistency,
the storage symlink, caches, cron/queue presence and recent errors.

Then confirm by hand:

- [ ] Home page renders with styling (CSS/JS loaded, not unstyled HTML)
- [ ] Product listing and a product detail page
- [ ] Search returns results
- [ ] Add to cart → cart page → checkout loads
- [ ] Login, logout, password reset email arrives
- [ ] Admin panel: product list, edit a product, **upload an image**
- [ ] The uploaded image renders on the storefront (proves `storage:link`)
- [ ] Contact form submits and the message reaches the inbox
- [ ] `https://ntiled.com.au/up` returns 200
- [ ] `https://ntiled.com.au/.env` returns 403/404 — **never** file contents
- [ ] Browser console clean on home, product and cart pages
- [ ] Padlock shown; no mixed-content warnings

---

## 8. AWS notes

The release/shared/current layout is unchanged. Differences:

| Concern | Hostinger | AWS |
|---|---|---|
| Web root | hPanel document root → `current/public` | nginx `root /var/www/ntiled/current/public;` |
| Queue worker | cron with `--max-time` | systemd unit with `Restart=always` |
| Uploads | `shared/storage/app/public` on disk | keep on EBS, or set `FILESYSTEM_DISK=s3` |
| Backups | `db-backup.sh` + nightly cron | same, plus RDS automated snapshots |
| SSL | hPanel free SSL, auto-renew | ACM on the ALB, or certbot |
| HTTPS detection | `TRUSTED_PROXIES=*` (LiteSpeed) | `TRUSTED_PROXIES=*` (ALB/CloudFront) |

Multi-instance on AWS: move `SESSION_DRIVER` and `CACHE_STORE` to `redis` so
sessions are shared, and move uploads to S3 so every instance sees them.

`TRUSTED_PROXIES` defaults to `*`, which is correct when the proxy is the only
route to the origin. If you expose the origin directly, list proxy IPs instead.
