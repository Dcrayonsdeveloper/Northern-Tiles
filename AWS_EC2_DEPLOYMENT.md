# AWS EC2 deployment — Northern TILE Distributors

Record of the live server build. Companion to `PRODUCTION_DEPLOYMENT.md`,
which describes the shared safety model; this file describes *this box*.

---

## 1. The server

| | |
|---|---|
| Instance | `i-03cd7b051c9a0d55c` (t4g.small, ARM64/Graviton) |
| Region / AZ | ap-southeast-2b (Sydney) |
| OS | Ubuntu 24.04 LTS |
| Public IP | 52.62.171.34 |
| SSH | `ssh -i "Northern Tile Distributors.pem" ubuntu@52.62.171.34` |
| Resources | 2 vCPU, 1.8 GB RAM, 29 GB disk, **2 GB swap** |

Swap is not optional here: the Vite build peaks above what 1.8 GB alone
provides. It is in `/etc/fstab`, so it survives reboots.

### Stack

nginx 1.24 · PHP 8.3.6 (FPM) · MariaDB 10.11 · Node 22 · Composer 2.10

PHP is tuned in `/etc/php/8.3/fpm/conf.d/99-ntiled.ini`
(`memory_limit=256M`, `upload_max_filesize=32M`, opcache on) and the pool is
capped at `pm.max_children = 10` — roughly 400 MB of workers, which leaves
MariaDB room on a 2 GB box.

---

## 2. Layout

```
/var/www/ntiled/
├── current -> releases/20260910-055309-b3462ae-local   # atomic symlink
├── releases/
├── rollback.sh
└── shared/                       # survives every deploy
    ├── .env                      # 640 ubuntu:www-data
    └── storage/
        ├── app/public/           # 950 uploaded files (333 MB)
        ├── backups/              # 700 ubuntu:ubuntu
        └── logs/
```

nginx serves `/var/www/ntiled/current/public`, so `.env`, `storage/` and
`vendor/` sit above the web root. Verified: `/.env` returns 403.

`public/storage` is linked directly to `shared/storage/app/public` (absolute),
not to the release's own `storage/`, so uploads keep resolving across deploys.

---

## 3. Services

| What | Where | Notes |
|---|---|---|
| Queue worker | systemd `ntiled-queue` | `Restart=always`, `--max-time=3600` |
| Scheduler | `/etc/cron.d/ntiled` | `schedule:run` every minute, as `www-data` |
| Nightly backup | `/etc/cron.d/ntiled` | 03:00 as `ubuntu`, 14-day rotation |
| Log rotation | `/etc/logrotate.d/ntiled` | weekly, 8 kept |

**The worker must name every queue.** The app dispatches to three:

```
--queue=emails,default,collections
```

`emails` carries `SendAbandonedCartEmailJob`, `collections` carries
`ReindexCollectionsForProductJob` (`app/Models/Product.php:110`). `queue:work`
only consumes queues it is told about, and a queue left off the list fails
silently — jobs pile up with no error anywhere. Add any new queue name here.

All services are `systemctl enable`d and were verified to return after a full
reboot.

---

## 4. What is deployed

* Code: working tree at commit `b3462ae` **plus 3 uncommitted local edits**
  (Instagram URL normalisation in `Footer.jsx`, `StorefrontHeader.jsx`,
  `Home.jsx`). Those edits exist only on this server and in the local working
  tree — **commit and push them**, or the next git-based deploy silently
  reverts the site.
* `deploy/` is excluded from releases: it is a stale packaged copy of the app
  (9,270 files, its own `vendor/`) that nothing at runtime references.
* Database: `northentiles`, imported from the local MariaDB on 2026-09-10.
  Verified row-for-row against local (638 products, 379 variants, 15 users,
  70 tables). App user `ntd`@`localhost` is scoped to this one database;
  MariaDB binds to 127.0.0.1 only.

---

## 5. Known-open items

1. ~~No SSL, no domain.~~ **Resolved 2026-09-10** — `besttiles.shop` is live
   over HTTPS with auto-renewal verified by `certbot renew --dry-run`. See §6.
2. ~~`SESSION_SECURE_COOKIE=false`.~~ **Resolved 2026-09-10** — now `true`,
   with `SESSION_DOMAIN=.besttiles.shop`, under a valid certificate.
3. **Search indexing is blocked on purpose.** `besttiles.shop` is a testing
   host and returns `X-Robots-Tag: noindex, nofollow`. Going public means
   removing it from the nginx robots map (§6) — until then nothing here will
   ever appear in Google, by design.
4. **Mail goes to the log.** `MAIL_MAILER=log` — local had the literal string
   `"null"` for SMTP credentials, so there are none to carry over. Contact
   forms, password resets and abandoned-cart email write to
   `storage/logs/laravel-*.log` and reach nobody until real SMTP is set.
5. **Backups are on the same EBS volume** as the database. That covers a bad
   deploy or migration, not losing the instance. Pull copies off-box:
   `scp -i <key> ubuntu@52.62.171.34:'/var/www/ntiled/shared/storage/backups/*.gz' ./`

---

## 6. Domain and SSL — besttiles.shop (live)

`besttiles.shop` was connected on 2026-09-10 as a **testing** domain while the
site is in development. Registrar GoDaddy, nameservers `ns77/ns78.domaincontrol.com`.

| Record | Value |
|---|---|
| A `@` | 52.62.171.34 |
| CNAME `www` | `@` |

Certificate: Let's Encrypt, covering `besttiles.shop` + `www.besttiles.shop`,
issued 2026-09-10, expires 2026-12-09. `certbot.timer` renews automatically.

`.env` runs HTTPS: `APP_URL=https://besttiles.shop`,
`SESSION_SECURE_COOKIE=true`, `SESSION_DOMAIN=.besttiles.shop`. Verified: the
session cookie carries `secure; httponly; samesite=lax`.

### Indexing is deliberately blocked

`/etc/nginx/conf.d/ntiled-robots-map.conf` returns `X-Robots-Tag: noindex,
nofollow` for `besttiles.shop`, `www.besttiles.shop` and the raw IP. This is a
test host for a site whose real home is ntiled.com.au, and an indexed duplicate
would compete with the real storefront. **To go public, remove the hostname
from that map and reload nginx.** The header is keyed by `Host`, so any other
domain pointed here is unaffected.

### Health checks no longer use plain HTTP

Certbot's `--redirect` added a port-80 block that `return 404`s anything that is
not the domain — good hygiene (the site should not answer on a bare IP), but it
broke `http://127.0.0.1/up`. Health checks now use:

```bash
curl --resolve besttiles.shop:443:127.0.0.1 https://besttiles.shop/up
```

which stays local and DNS-independent while exercising the real TLS vhost.
`rollback.sh` was updated to match. **Any new health check must do the same** —
a plain `http://127.0.0.1/up` returns 404 and looks like an outage.

### Pointing a different domain here later

```bash
sudo sed -i 's/server_name .*/server_name <domain> www.<domain> _;/' \
  /etc/nginx/sites-available/ntiled
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d <domain> -d www.<domain>
sudo -e /var/www/ntiled/shared/.env       # APP_URL, SESSION_DOMAIN
cd /var/www/ntiled/current && php artisan config:cache
sudo systemctl reload php8.3-fpm && sudo systemctl restart ntiled-queue
```

`config:cache` is mandatory — a cached config ignores `.env` entirely. Assets
are content-hashed and root-relative, so no rebuild is needed for a URL change.

## 7. Routine operations

```bash
cd /var/www/ntiled/current

bash scripts/preflight-check.sh                    # full health report
bash scripts/db-backup.sh pre-deploy               # verified backup
sudo systemctl status ntiled-queue                 # worker
php artisan queue:failed                           # failed jobs
sudo tail -f /var/www/ntiled/shared/storage/logs/laravel-$(date +%F).log

/var/www/ntiled/rollback.sh                        # previous release
/var/www/ntiled/rollback.sh <release-dir-name>     # a specific one
```

Rollback is code-only and takes about a second; it does not touch the
database. For a bad migration, restore with `scripts/db-restore.sh` as well —
see `PRODUCTION_DEPLOYMENT.md` §6b.

---

## 8. Next deploy

There is no CI path to this box yet — no deploy key, and the GitHub Actions
workflow still targets Hostinger. Until that is wired up, a release is:
stage into `releases/<stamp>/`, symlink `.env` and `storage` from `shared/`,
`composer install --no-dev -o`, `npm ci && npm run build`, `migrate --force`
if needed, cache config/routes/views, then swap `current` and reload
php-fpm. Back up first; health-check `/up` after; roll back if it is not 200.
