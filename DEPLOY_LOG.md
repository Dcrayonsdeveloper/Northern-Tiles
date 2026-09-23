# Deploy log

Every entry below is written by `ship.sh` when something goes to production.
It records what changed, who shipped it, the commit on GitHub, the commit the
server moved from and to, migrations applied, and the smoke-test results.

Started 23 Sep 2026, after two agents deploying hand-picked files onto the same
live folder left the server running half of each branch — one agent's routes
file overwritten, the other's controller never uploaded — with no record of
what was actually live.

**To ship:** `./ship.sh "what you changed"`
