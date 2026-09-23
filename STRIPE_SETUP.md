# Stripe payments — setup

Card payments via Stripe. The Stripe account (`acct_1QwrvB2m6QBIJEzi`) is
shared with the Shopify storefront; this application uses its **own** API keys,
so either integration can be rotated or revoked without touching the other.

---

## 1. How the flow works

```
customer picks "Credit/Debit Card"
  → order created, payment_status = pending      (no money taken yet)
  → redirected to /checkout/{order}/payment      (Stripe Elements)
  → customer pays
  → Stripe redirects back to /checkout/{order}/payment-confirm
  → SERVER re-fetches the intent from Stripe, re-checks amount + currency
  → payment_status = paid, paid_at stamped
```

The order is created **before** payment on purpose. A declined card, a closed
tab, or a customer who needs a different card can return to the same URL and
retry — rather than rebuilding a cart that has already been emptied.

The browser is never trusted. It supplies only an order number, never an
amount, and whatever it claims on return is re-verified against Stripe.

---

## 2. Environment

| Key | Meaning |
|---|---|
| `STRIPE_KEY` | Publishable key (`pk_…`). Safe to expose — it is sent to the browser. |
| `STRIPE_SECRET` | Secret key (`sk_…`). Server only. Never commit or paste it anywhere. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret (`whsec_…`). **Blank until step 3 below.** |
| `STRIPE_CURRENCY` | `aud`. Must match what `PricingService` computes. |
| `STRIPE_ENABLED` | Card payment is hidden at checkout until this is `true`. |

Use **test** keys (`sk_test_` / `pk_test_`) for everything except production.
Test mode takes fake cards and moves no real money — card `4242 4242 4242 4242`,
any future expiry, any CVC.

After changing any of these on the server:

```bash
php artisan config:cache && sudo systemctl reload php8.3-fpm
```

A cached config ignores `.env` entirely, so skipping this leaves the old values
live.

---

## 3. ⚠️ THE WEBHOOK — add this last

**The code is written and deployed. Nothing works until you create the endpoint
in Stripe and paste the signing secret into `.env`.**

### Why it matters

Without it, a customer who pays and then closes the tab — or loses signal
during a 3-D Secure step — never reaches the confirm URL. **Stripe has their
money and the order stays `pending` forever.** Stripe retries the webhook for
up to three days, so it is what actually guarantees an order reaches its final
state.

### Steps

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**

2. **Endpoint URL:**
   ```
   https://besttiles.shop/stripe/webhook
   ```

3. **Select these three events** (and only these):
   ```
   payment_intent.succeeded
   payment_intent.payment_failed
   charge.refunded
   ```

4. Click **Add endpoint**, then **Reveal** the **Signing secret** (`whsec_…`)

5. On the server, put it in `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
   ```

6. Apply it:
   ```bash
   cd /var/www/ntiled/current
   php artisan config:cache
   sudo systemctl reload php8.3-fpm
   ```

7. Verify: back in Stripe → your endpoint → **Send test webhook** →
   `payment_intent.succeeded`. You want a **200**.

### Until you do step 5

The endpoint deliberately returns **503 and does nothing**. An unverified
webhook is worse than none — anyone who knew the URL could POST
`payment_intent.succeeded` and mark orders paid for free. Verification is not
optional, so the route refuses to act without a secret rather than falling back
to trusting the payload.

### Testing locally

```bash
stripe login
stripe listen --forward-to localhost:8000/stripe/webhook
# prints a whsec_… for local use — put that in your local .env
stripe trigger payment_intent.succeeded
```

---

## 4. What the webhook does

| Event | Effect |
|---|---|
| `payment_intent.succeeded` | Re-verifies amount + currency, then `payment_status = paid`, stamps `paid_at` |
| `payment_intent.payment_failed` | `payment_status = failed` — never overwrites an order already `paid` |
| `charge.refunded` | `refunded` only on a **full** refund; a partial refund logs and leaves it `paid` |

Anything else gets a 200 and is ignored. Returning an error for an event we do
not handle would make Stripe retry it for three days and eventually disable the
endpoint.

A payment with no matching local order is logged at `info`, not as an error —
the shared Stripe account also serves Shopify, so those are expected.

The webhook and the browser redirect run the same verification path, so
whichever arrives first wins and the second is a harmless no-op.

---

## 5. Notes and gotchas

**The webhook route is stateless.** It is excluded from session, cookie, Inertia
and CSRF middleware (`routes/web.php`). Stripe has no session, so starting one
costs a query per delivery, returns a useless cookie to Stripe, and turns any
session-store blip into a 500 that Stripe then retries for three days.

Listing the path in `validateCsrfTokens(except:)` alone is **not** sufficient —
that only skips the token comparison; the middleware still runs and calls
`$request->session()->token()`, which throws once sessions are off. It must be
removed from the stack entirely.

**`orders.currency` now defaults to `AUD`.** It was created defaulting to `INR`,
a leftover from the template this project came from. Every live path set AUD
explicitly, so no row was ever wrong — but Stripe charges in the order's
currency, and one forgetful path would have billed Rupees. At roughly
A$1 = ₹55, a A$500 order would have taken about A$9.

**UPI was removed from checkout.** India-only rail on an Australian business
billing AUD — it could never have completed. The one historic order carrying
`payment_method = 'upi'` still reads fine; the list only governs new checkouts.

**Payments carry `source: ntiled-web` in Stripe metadata**, so this site's
charges are distinguishable from Shopify's in the shared account — which matters
for the Xero reconciliation.

**Order numbers are prefixed `JKR-`** (from the template this project started
from). They will not collide with Shopify's numbering, but they are the wrong
branding and worth renaming before go-live.

---

## 6. Before taking a real payment

- [ ] Roll the secret key if it has ever been pasted into chat, email or Slack
- [ ] Test the whole flow end-to-end in **test mode** first
- [ ] Add the webhook (section 3) — **this is the one that is easy to forget**
- [ ] Configure real SMTP. `MAIL_MAILER=log` means order confirmations and
      Stripe receipts currently reach nobody.
- [ ] Confirm `STRIPE_ENABLED=true` and `APP_URL` is the `https://` domain
