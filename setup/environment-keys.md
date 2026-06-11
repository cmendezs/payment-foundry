# Environment Keys

This file documents which keys and environment variables payment-foundry expects, and where to get them. It does not contain any real secrets, real values go in your local `.env` (gitignored).

## Stripe (required)

All keys below are **test mode** keys. Use test mode for the entire engagement unless the team is explicitly working on go-live cutover.

| Variable | Where to find it | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard > Developers > API keys, with "Test mode" toggled on | Starts with `sk_test_`. Server-side only, never expose to a browser or mobile client. |
| `STRIPE_PUBLISHABLE_KEY` | Same page as above | Starts with `pk_test_`. Safe to use client-side. |
| `STRIPE_WEBHOOK_SECRET` | Output of `stripe listen` (Stripe CLI), or Dashboard > Developers > Webhooks for a configured endpoint | Starts with `whsec_`. Used to verify webhook signatures. |
| `STRIPE_CONNECT_CLIENT_ID` | Dashboard > Settings > Connect > Platform settings | Only needed if the engagement involves Stripe Connect (Platform). Starts with `ca_`. |

[Unverified] Exact Dashboard navigation paths may change over time. If a path above does not match what you see, search the Stripe Dashboard for "API keys" / "Webhooks" / "Connect settings", or check https://stripe.com/docs

## Stripe CLI (recommended for local webhook testing)

Install: https://stripe.com/docs/stripe-cli

```bash
stripe login
stripe listen --forward-to localhost:<port>/webhooks/stripe
```

The CLI prints a `whsec_...` value when you run `stripe listen`, use that as `STRIPE_WEBHOOK_SECRET` for local development.

## Adding keys for a new PSP

When a new PSP folder is added under `psps/<name>/`, add a corresponding section to this file documenting its required keys, and extend `.env.example` with placeholder variables (prefixed with the PSP name, e.g., `ADYEN_API_KEY`).
