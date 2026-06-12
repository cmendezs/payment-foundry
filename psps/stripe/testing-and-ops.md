# Stripe: Testing and Operations

Covers test/live mode practices, test data, webhook testing, load testing, error handling and rate limits, API versioning, and general operational hygiene (IDs, metadata, expansion, support model). Use this when setting up a test environment, preparing for go-live, or troubleshooting API errors.

## Verification References

Use these pointers during `/validate-context` and before generating final integration code for this product line. The product-line file below describes stable patterns; rate limits, webhook ack timeouts, retry windows, test PaymentMethod identifiers, API-versioning behavior, and webhook-endpoint limits must be re-verified against the sources here.

- **Canonical docs:**
  - https://stripe.com/docs/testing covers the test PaymentMethod catalog and triggers
  - https://stripe.com/docs/webhooks covers webhook ack timeout, retry behavior, and burst guidance
  - https://stripe.com/docs/webhooks/signatures covers signature verification
  - https://stripe.com/docs/rate-limits covers current rate limits per mode and per key type
  - https://stripe.com/docs/api/versioning and https://stripe.com/docs/upgrades cover version pinning and per-account default behavior
  - https://stripe.com/docs/api/expanding_objects covers the `expand` parameter surface
  - https://stripe.com/docs/stripe-cli covers Stripe CLI commands used for local webhook testing
  - https://github.com/stripe/stripe-mock covers stripe-mock for local/CI mocking
- **API Changelog:** https://stripe.com/docs/upgrades, watch for changes to rate limits, webhook delivery semantics, and webhook-endpoint limits per account.
- **Stripe MCP hints (if connected):**
  - To check the connected account's current default API version, retrieve the account object.
  - To check current webhook endpoints, list `webhook_endpoints` for the connected account.
  - To check current rate-limit posture and any account-specific overrides, query the rate-limits doc and the team's Stripe account team where overrides exist.
- **What to re-verify before relying on this file:**
  - Current test-mode and live-mode rate limits, per key type and per HTTP method bucket.
  - Webhook ack timeout, retry window, and failure-notification behavior.
  - Per-account webhook endpoint limits and the maximum number of distinct API versions allowed per mode.
  - Current default-version rollback window after upgrading.
  - Current test PaymentMethod identifiers in use for the team's relevant scenarios.

## Test Mode vs. Live Mode

Every Stripe account has a single `acct_xxxxx` ID with two completely separate object graphs, test mode and live mode, each with its own key set:

| | Live mode | Test mode |
|---|---|---|
| Publishable key | `pk_live_*` | `pk_test_*` |
| Secret key | `sk_live_*` | `sk_test_*` |
| Restricted key | `rk_live_*` | `rk_test_*` |
| Webhook signing secret | `whsec_*` (per live endpoint) | `whsec_*` (per test endpoint, or per `stripe listen` session) |

Customers, PaymentMethods, PaymentIntents, Charges, Refunds, Subscriptions, etc. created in one mode are entirely invisible in the other. For Billing specifically, set matching Price/Product IDs across modes when creating live-mode equivalents, see `psps/stripe/billing.md` pitfall #5.

## Test Data

When writing test code, **use a `PaymentMethod` test token rather than a raw card number** (e.g., `pm_card_visa`), even in test mode. Code that handles raw card numbers directly, even server-side in test mode, may not be PCI-compliant once moved to live mode, and the habit is easy to carry over accidentally.

Test PaymentMethods let you simulate, by card brand or country:

- Successful payments.
- Card errors: declines, fraud blocks, invalid data.
- Disputes and refunds.
- 3D Secure and PIN authentication outcomes.
- International card behavior (Europe/Middle East, Americas, Asia-Pacific).

Common examples (non-exhaustive, [Unverified] confirm the current full set at the links below):

- `pm_card_visa` — generic successful Visa card.
- `pm_card_createDispute` — payment that will later be disputed.
- `pm_card_fr` — a French-issued card, useful for testing country/network-specific behavior (e.g., Cartes Bancaires).
- `pm_card_authenticationRequiredOnSetup` — forces a 3DS challenge.
- `pm_card_bypassPending` — bypasses pending states for delayed payment methods.
- `address_line1_no_match`, `file_identity_document_success` — values for testing address verification and identity document checks.
- `tok_visa_triggerNextRequirements` — triggers additional verification requirements (useful for Connect onboarding testing).

Non-card payment methods (PayPal, bank debits, etc.) have their own test values and scenario-triggering patterns, see `psps/stripe/payments.md` for method-specific notes (e.g., PayPal billing-detail email triggers).

## Testing Webhooks

Test webhooks for a specific event by:

1. Creating real test-mode activity that triggers the event.
2. Manually sending a test event (with mock data) from the Dashboard.
3. Using the **Stripe CLI** to run flows/fixtures and trigger real events.

The Stripe CLI is best suited for local development (no public URL needed):

- `stripe listen` — locally listen for events and forward them to your application.
- `stripe trigger <event>` — trigger a specific event type from the command line (or from automated tests).
- `stripe resend <event_id>` — resend a previously triggered event.

Every event includes a `livemode` boolean indicating whether it originated from live or test mode, useful when a single endpoint receives both (not recommended long-term, but common during initial setup).

### General webhook handling notes

- **Limit the event types** an endpoint subscribes to, to those the integration actually handles. Listening to all events places unnecessary load on your servers, and the subscribed event list can be changed later.
- **Acknowledge quickly with a 2xx response** before running complex logic, queue the event for asynchronous processing if needed. [Unverified: confirm the current ack timeout against https://stripe.com/docs/webhooks. Recent docs have stated 20 seconds.] Any non-2xx response (including 3xx) is also a failure.
- **Failed deliveries are retried** over several days with exponential backoff; after retries are exhausted, the event is marked failed with no further attempts, and Stripe emails about the misconfigured endpoint.
- **Event order is not guaranteed.** Do not design logic that assumes events for a given object arrive in a particular sequence.
- **Duplicate deliveries can happen.** Make event processing idempotent, e.g., by recording processed event IDs and skipping ones already seen.
- Stripe does not rate-limit webhook deliveries, but bursts are bounded. [Unverified: confirm current burst guidance against https://stripe.com/docs/webhooks. Recent docs have stated roughly 200 RPS.]

## Load Testing

Stripe **discourages load testing against test mode**: API rate limits are lower in test mode (see Rate Limits below), so a load test is likely to hit limits it would not hit in production. Test mode also does not fully represent live latency, a live-mode card charge calls out to a payment gateway, while the test-mode equivalent is mocked, giving a different latency profile.

**Recommendation**: build the integration with a configurable mocking layer for Stripe API calls, and enable it for load tests. Stripe provides **`stripe-mock`**, a mock HTTP server that responds like the real Stripe API, useful for making test suites and load tests faster and less brittle without depending on Stripe's test-mode infrastructure or rate limits.

Adopting `stripe-mock` (and Test Clocks for Billing, see `psps/stripe/billing.md`) is a test-suite design decision worth raising with `sub-agents/backend-developer.md` (test suite design) and `sub-agents/solution-architect.md` (environment/config management for CI).

## Error Handling and Rate Limits

### HTTP status codes

| Status | Meaning |
|---|---|
| `200 OK` | Everything worked as expected. |
| `400 Bad Request` | The request was unacceptable, often a missing or invalid parameter. |
| `401 Unauthorized` | No valid API key provided. |
| `402 Request Failed` | Parameters were valid, but the request failed (e.g., a charge was declined). |
| `404 Not Found` | The requested resource does not exist (e.g., wrong object ID). |
| `409 Conflict` | The request conflicts with another request, often due to idempotency constraints. |
| `429 Too Many Requests` | Rate limit exceeded. |
| `5xx` | Something went wrong on Stripe's end (rare, contact Stripe if persistent). |

### Error object shape

```json
{
  "error": {
    "type": "card_error",
    "code": "card_declined",
    "decline_code": "generic_decline",
    "message": "Your card was declined.",
    "doc_url": "https://stripe.com/docs/error-codes/card-declined",
    "charge": "ch_****"
  }
}
```

- `error.type` — a machine-readable classification (`invalid_request_error`, `card_error`, `api_error`, etc.).
- `error.code` — a more specific error code, see https://stripe.com/docs/error-codes
- `error.message` — a human-readable description (do not parse this for logic, use `code`/`type`/`decline_code`).
- `error.doc_url` — a link to documentation about this specific error.
- `error.param` — the request parameter that caused the error, when applicable.
- `error.decline_code` — for `card_error` with `code: card_declined`, a finer-grained reason (e.g., `insufficient_funds`, `lost_card`).

### Rate limits

- Rate-limited requests return HTTP `429` (also used for timeouts).
- Limits are measured **per account**, in requests per second (RPS), not per API key.
- Default limits differ between test mode and live mode, and between publishable and secret/restricted keys. [Unverified: confirm current per-mode and per-key-type RPS limits against https://stripe.com/docs/rate-limits. Recent docs have stated test mode 25 RPS, live mode 100 RPS, publishable-key 50 RPS, secret/restricted-key 100 RPS.]
- Read (`GET`) and write (`POST`/`PUT`/`DELETE`) requests are tracked in **separate buckets**.
- Short bursts above the steady-state limit are generally tolerated.
- The `Stripe-Should-Retry` response header indicates when Stripe has additional information suggesting a retry is safe.
- **Retry strategy**: exponential backoff with jitter (random delay added to each retry interval) to avoid synchronized retry storms.

## API Versioning

- Each account has a **default API version**, named by date (e.g., `2020-03-02`), set to the latest version available when the account was created.
- If a request does not specify `Stripe-Version`, the account's default version is used.
- Any request can pin a specific API version via the `Stripe-Version` header, regardless of the account default.
- The account default can be upgraded in the Dashboard, but **only to the latest version**, and a bounded rollback window applies. [Unverified: confirm current rollback window against https://stripe.com/docs/upgrades. Recent docs have stated 72 hours.] Review https://stripe.com/docs/upgrades for the changes in each version before upgrading.

### Recommended upgrade strategy

1. Add a new webhook endpoint (via the API) pinned to the new API version, and update the integration to handle any changed event payloads on that endpoint.
2. Update application code to send the new `Stripe-Version` header on requests.
3. Once verified, update the account's default API version.

### Versioning effects on webhook endpoints

- **Test-mode endpoints always follow the latest API version**, regardless of what version they were created with.
- **Live-mode endpoints on "default version"** move to the new default whenever the account default is upgraded.
- **Live-mode endpoints pinned to a specific version** stay on that version until explicitly changed. A per-account cap on endpoint count and on distinct API versions per mode applies. [Unverified: confirm current limits against https://stripe.com/docs/webhooks. Recent docs have stated up to 16 endpoints across at most 3 distinct API versions per mode.]

## IDs, Metadata, and Expansion

### Object IDs

Every Stripe object ID is a prefix plus a random string (e.g., `acct_*`, `pi_*`, `ch_*`, `req_*`), up to 255 characters, case-sensitive. Store at least the IDs of the core objects the integration creates, this makes it straightforward to fetch additional data later and is essential for support/debugging conversations with Stripe (response headers include a `request-id` for this purpose). Keep Stripe IDs near the corresponding part of your schema (e.g., a `stripe_customer_id` column on a `Customers` table). See `psps/stripe/payments.md` pitfall #10 for the database column-sizing implication.

### Metadata

Updatable objects (Account, Charge, Customer, Transfer, etc.) support a `metadata` field for arbitrary key-value data: internal user/order IDs, refund context, A/B test cohorts, reporting keys. Metadata:

- Is always present on the object, in API responses and webhook events.
- Is not used by Stripe for any purpose (e.g., not a fraud signal).
- Is not shown to end customers unless the integration displays it.

### Expansion

API responses return only the primary object by default (e.g., `/v1/refunds` returns a `Refund`, not the full `Charge` it relates to). The `expand` parameter pulls related objects inline, trading fewer round trips against larger/slower responses. The API reference indicates which fields are expandable (e.g., `payment_method` on a PaymentIntent, `charge` on a Refund).

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  confirm: true,
  customer: customer.id,
  payment_method: 'pm_card_visa_debit',
  amount: 100,
  currency: 'usd',
  expand: ['charges.data.balance_transaction'],
});
```

Use `expand` for data needed immediately (e.g., to render a confirmation page); for data only needed occasionally (e.g., debugging), a follow-up request is often simpler than expanding on every call.

## Channels to Watch

- Stripe's developer digest: https://stripe.dev/#subscribe — notifications about product launches, API updates, and more.
- API changelog: https://stripe.com/blog/changelog and https://stripe.com/docs/upgrades — for API version changes.
- Guides: https://stripe.com/guides/ — industry updates, business insights, and product resources.

## Support Model

Enterprise Stripe accounts typically include a dedicated Technical Account Manager, a dedicated support channel/alias, and incident-response SLAs (e.g., a fast-track channel for "all charges failing" type incidents). The specifics (response times, escalation paths, eligible incident types) vary by contract. Confirm the team's actual support tier and escalation process with their Stripe account team rather than assuming a default, and document it in the per-engagement go-live checklist (see `context/go-live-checklist-template.md`).

## Relevant Stripe Documentation

- Testing: https://stripe.com/docs/testing
- Connect testing: https://stripe.com/docs/connect/testing
- ACH testing: https://stripe.com/docs/ach#testing-ach
- stripe-mock: https://github.com/stripe/stripe-mock
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Webhooks: https://stripe.com/docs/webhooks
- Webhook signatures: https://stripe.com/docs/webhooks/signatures
- Rate limits: https://stripe.com/docs/rate-limits
- Error codes: https://stripe.com/docs/error-codes
- API versioning: https://stripe.com/docs/api/versioning
- Upgrades: https://stripe.com/docs/upgrades
- Expanding objects: https://stripe.com/docs/api/expanding_objects
- IP addresses: https://stripe.com/docs/ips
- API keys: https://stripe.com/docs/keys#safe-keys
- Subscriptions and billing testing (Test Clocks): see `psps/stripe/billing.md`
- Go-live readiness checklist: see `context/go-live-checklist-template.md`
