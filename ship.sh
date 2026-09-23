#!/usr/bin/env bash
#
# ship.sh — commit, push to main, deploy to production, and record what went out.
#
#   ./ship.sh "short description of the change"
#   ./ship.sh --check      run every safety check and stop (changes nothing)
#
# Written after 23 Sep 2026, when two agents deploying hand-picked files onto
# the same live folder left the server holding half of each branch: one agent's
# routes file was overwritten (wishlist 404) and the other's controller was
# never uploaded (visualizer 500). Both deploys reported success.
#
# Three things here exist to stop that happening again:
#
#   1. The ancestor guard. The server records the commit it is running. This
#      refuses to deploy unless that commit is an ancestor of what you are
#      deploying — so a tree that has not seen someone else's work cannot
#      silently overwrite it.
#   2. It ships the whole tree from git, never a list of files you remembered
#      to copy. Half-deployed features are how the visualizer 500'd.
#   3. It appends to DEPLOY_LOG.md, so what is live and who put it there is
#      written down rather than reconstructed later from mtimes.
#
set -euo pipefail

HOST="ubuntu@52.64.115.58"
KEY="northern-tiles-key.pem"
RELEASE="/var/www/ntiled/releases/20260915-103220-545ab0c"
LOG="DEPLOY_LOG.md"
BRANCH="main"

MSG="${1:-}"
say()  { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$*"; }
die()  { bad "$*"; exit 1; }
ssh_() { ssh -i "$KEY" -o BatchMode=yes "$HOST" "$@"; }

[ -f "$KEY" ] || die "Run this from the project root ($KEY not found)."

if [ -z "$MSG" ]; then
    printf 'Usage: ./ship.sh "what you changed"\n       ./ship.sh --check\n' >&2
    exit 1
fi

CHECK_ONLY=false
[ "$MSG" = "--check" ] && CHECK_ONLY=true

# ── 1. on the right branch ──────────────────────────────────────────────
say "1/8  Branch"
CURRENT="$(git branch --show-current)"
[ "$CURRENT" = "$BRANCH" ] || die "On '${CURRENT}'. Run: git checkout ${BRANCH}"
ok "on ${BRANCH}"

# ── 2. take in anything already on GitHub ───────────────────────────────
say "2/8  Syncing with GitHub"
git fetch origin --quiet
BEHIND="$(git rev-list --count HEAD..origin/${BRANCH})"
if [ "$BEHIND" -gt 0 ]; then
    if [ -n "$(git status --porcelain)" ]; then
        bad "origin/${BRANCH} has ${BEHIND} commit(s) you do not have, and you have uncommitted work."
        die "Commit or stash first, then run again — pulling now could lose your edits."
    fi
    git merge --ff-only "origin/${BRANCH}" --quiet || die "Cannot fast-forward. Resolve by hand: git pull origin ${BRANCH}"
    ok "pulled ${BEHIND} commit(s) from GitHub"
else
    ok "up to date with GitHub"
fi

# ── 3. THE GUARD — never overwrite work that is already live ────────────
say "3/8  What is on the server"
SERVER_REV="$(ssh_ "cat ${RELEASE}/REVISION 2>/dev/null || echo none" | tr -d '\r\n')"
[ "$SERVER_REV" = "none" ] && die "Server has no REVISION file — deploy once by hand and write the SHA there."

if ! git cat-file -e "${SERVER_REV}^{commit}" 2>/dev/null; then
    bad "Server runs ${SERVER_REV:0:7}, a commit this clone has never seen."
    die "Run: git fetch --all"
fi

if ! git merge-base --is-ancestor "$SERVER_REV" HEAD; then
    bad "Server runs ${SERVER_REV:0:7}, which is NOT in your history."
    bad "Someone deployed after you last pulled. Deploying would erase their work."
    printf '\n  On the server but not in yours:\n'
    git log --oneline "HEAD..${SERVER_REV}" 2>/dev/null | head -10 | sed 's/^/    /'
    printf '\n  Fix:  git pull origin %s   then run this again\n\n' "$BRANCH"
    exit 1
fi
ok "server at ${SERVER_REV:0:7} — an ancestor, safe to deploy"

# ── 4. what is about to change ──────────────────────────────────────────
say "4/8  Changes"
CHANGED="$(git status --porcelain | sed 's/^...//' | head -40)"
if [ -z "$CHANGED" ] && [ "$(git rev-parse HEAD)" = "$SERVER_REV" ]; then
    ok "nothing to commit and server already current — nothing to do"
    exit 0
fi
[ -n "$CHANGED" ] && echo "$CHANGED" | sed 's/^/  /' || echo "  (already committed)"

if [ "$CHECK_ONLY" = true ]; then
    say "Checks passed — nothing was committed or deployed (--check)"
    exit 0
fi

# ── 5. commit ───────────────────────────────────────────────────────────
say "5/8  Commit"
if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -q -m "${MSG}"
    ok "committed: ${MSG}"
else
    ok "nothing new to commit"
fi
LOCAL_REV="$(git rev-parse HEAD)"

# ── 6. build ────────────────────────────────────────────────────────────
say "6/8  Build"
npm run build > /tmp/ship-build.log 2>&1 || { tail -20 /tmp/ship-build.log; die "Build failed — nothing deployed, nothing pushed."; }
grep -q "built in" /tmp/ship-build.log || die "Build produced no output — nothing deployed."
ok "assets built"

# ── 7. deploy the whole tree, then record the revision ──────────────────
say "7/8  Deploy"
PKG="/tmp/ship-$(date +%s).tgz"
tar -czf "$PKG" app routes database/migrations resources public/build tools 2>/dev/null
scp -q -i "$KEY" "$PKG" "${HOST}:/tmp/ship.tgz"
ssh_ "sudo tar -xzf /tmp/ship.tgz -C ${RELEASE} \
   && sudo chown -R www-data:www-data ${RELEASE}/app ${RELEASE}/routes ${RELEASE}/database ${RELEASE}/resources ${RELEASE}/public/build ${RELEASE}/tools \
   && php -l ${RELEASE}/routes/web.php > /dev/null"
ok "files in place ($(du -h "$PKG" | cut -f1))"

echo "$LOCAL_REV" | ssh_ "sudo tee ${RELEASE}/REVISION > /dev/null && sudo chown www-data:www-data ${RELEASE}/REVISION"
MIGRATED="$(ssh_ "cd /var/www/ntiled/current \
   && sudo -u www-data php artisan optimize:clear > /dev/null 2>&1 \
   && sudo -u www-data php artisan migrate --force 2>&1 | tail -2 | tr -d '\r' | xargs")"
ssh_ "sudo systemctl reload php8.3-fpm"
ok "REVISION → ${LOCAL_REV:0:7}; ${MIGRATED}"

# ── 8. is it actually up? then write it down and push ───────────────────
say "8/8  Smoke test"
RESULTS=""
FAILED=0
for path in / /shop /cart /blog /visualizer; do
    code="$(ssh_ "curl -s -o /dev/null -w '%{http_code}' 'http://127.0.0.1${path}' -H 'Host: 52.64.115.58'")"
    RESULTS="${RESULTS} ${path}=${code}"
    if [ "$code" = "200" ]; then ok "${path} ${code}"; else bad "${path} ${code}"; FAILED=1; fi
done

FILES="$(git show --stat --oneline "$LOCAL_REV" | tail -n +2 | head -20 | sed 's/^/  /')"
{
    printf '\n## %s — `%s`\n\n' "$(date -u '+%Y-%m-%d %H:%M UTC')" "${LOCAL_REV:0:7}"
    printf '**%s**\n\n' "$MSG"
    printf -- '- Shipped by: `%s`\n' "$(git config user.name || echo unknown)"
    printf -- '- GitHub: pushed to `%s` (%s)\n' "$BRANCH" "${LOCAL_REV:0:7}"
    printf -- '- Server: %s → %s\n' "${SERVER_REV:0:7}" "${LOCAL_REV:0:7}"
    printf -- '- Migrations: %s\n' "${MIGRATED:-none}"
    printf -- '- Smoke test:%s\n\n' "$RESULTS"
    printf 'Files changed:\n```\n%s\n```\n' "$FILES"
} >> "$LOG"

git add "$LOG"
git commit -q -m "chore(log): record deploy ${LOCAL_REV:0:7}"
git push -q origin "$BRANCH"
ok "pushed to GitHub and recorded in ${LOG}"

if [ "$FAILED" = "1" ]; then
    printf '\n\033[31mDeployed, but a page is unhealthy. Check:\033[0m\n'
    printf '  ssh -i %s %s "tail -40 /var/www/ntiled/shared/storage/logs/laravel-$(date +%%F).log"\n\n' "$KEY" "$HOST"
    exit 1
fi

say "Shipped ${LOCAL_REV:0:7} ✓  (GitHub + server, logged in ${LOG})"
