# Stripe: Payments

Covers Payment Intents, Payment Methods, Charges, Refunds, and Webhooks. This is the core flow nearly every Stripe integration is built on.

## Verification References

Use these pointers during `/validate-context` and before generating final integration code for this product line. The product-line file below describes stable patterns; status, pricing, and capability gating must be re-verified against the sources here.

- **Canonical docs:**
  - https://stripe.com/docs/payments/payment-intents covers Payment Intents lifecycle and statuses
  - https://stripe.com/docs/payments/payment-element covers Payment Element behavior, deferred-intent path, customization
  - https://stripe.com/docs/payments/accept-a-payment covers the recommended end-to-end accept flow
  - https://stripe.com/docs/webhooks covers webhook signing, retries, and event types
  - https://stripe.com/docs/refunds covers the Refund object and per-method refund windows
  - https://stripe.com/docs/currencies covers zero-decimal currencies and current currency support
  - https://stripe.com/docs/payments/multicapture covers Multi-Capture availability, capture limits, network support
  - https://stripe.com/docs/payments/extended-authorization covers extended-auth windows per network
  - https://stripe.com/docs/payments/klarna, .../paypal, .../bancontact, .../ideal cover per-payment-method timing and constraints
  - https://stripe.com/docs/payments/account/statement-descriptors covers statement descriptor format rules
  - https://stripe.com/docs/payment-links covers Payment Links creation, behavior, and customization
  - https://stripe.com/docs/api/payment_links covers the Payment Links API, line items, after-completion actions, and Connect parameters
- **API Changelog:** https://stripe.com/docs/upgrades, watch for breaking changes to PaymentIntents, refunds, capture, and webhook event names referenced in this file.
- **Stripe MCP hints (if connected):**
  - To check Multi-Capture support for a given PaymentMethod on the connected account, inspect `payment_method_options.card.multi_capture_supported` on a created PaymentIntent.
  - To check the connected account's current API version, query the account object via the API reference.
  - To check whether a feature is currently in beta or requires a beta header, query the API Changelog by topic.
- **What to re-verify before relying on this file:**
  - Availability and exact pattern of the deferred-intent Payment Element path on the team's account.
  - Multi-Capture availability and any pricing-model gating for the team's account, plus the supported card networks and per-PaymentIntent capture-count limit currently in force.
  - Per-network extended-authorization windows (e.g., Visa, Mastercard) and per-method capture/refund windows for PayPal, Klarna, Bancontact, iDEAL.
  - Current statement descriptor format rules (length, allowed characters).
  - Current full list of zero-decimal currencies.
  - Klarna line-item limits and whether any beta header is still required for line items on the team's API version.

## Integration Patterns

### Recommended: Payment Intents + Payment Element

The current recommended pattern for accepting online payments:

1. Server creates a `PaymentIntent` for the order amount and currency.
2. Server returns the PaymentIntent's `client_secret` to the frontend.
3. Frontend uses Stripe.js with the **Payment Element** (a single embeddable component that adapts to show the payment methods enabled in the Dashboard: cards, wallets, bank debits, BNPL, etc.) to collect payment details and confirm the PaymentIntent.
4. Stripe handles any required authentication (3D Secure) automatically as part of confirmation.
5. Server is notified of the final outcome via webhooks (`payment_intent.succeeded`, `payment_intent.payment_failed`), which is the source of truth, not the frontend's confirmation response alone.

This pattern keeps raw card data out of the team's servers and frontend code (Stripe.js handles it via an iframe), which significantly reduces PCI scope (typically SAQ A).

### Payment Element integration paths

When configuring how the Payment Element decides which payment methods to show, there are two approaches:

- **`automatic_payment_methods: { enabled: true }`** (recommended default): payment methods enabled in the Dashboard are shown automatically, with no code changes needed as the business enables new methods. This is the path described in the recommended pattern above.
- **`payment_method_types: [...]`**: explicitly list which payment method types to enable on the PaymentIntent. Useful when custom business logic needs to filter which methods are offered (e.g., excluding a method for certain order types), or for use cases not yet supported by `automatic_payment_methods` (e.g., some Billing/subscription scenarios).

An integration path allows rendering the Payment Element **before** creating a PaymentIntent (deferred-intent confirmation), with the PaymentIntent created and confirmed at submission time, either client-side or server-side. This path is attractive for dynamic checkouts where the final amount or currency is not known until the customer interacts with the page (e.g., shipping method selection changes the total). [Unverified: confirm current availability and exact pattern via the Verification References block, status and required parameters have shifted between releases.]

### Alternative: Payment Links (no-code or API)

Payment Links are Stripe-hosted checkout pages identified by a shareable URL. The team does not host the checkout UI; Stripe does. A Payment Link references one or more Prices (see [`products-and-prices.md`](products-and-prices.md)) and, on submission, creates a PaymentIntent (one-time Prices) or a Subscription (recurring Prices) and routes the customer through Stripe's hosted page, 3DS challenge if needed, and confirmation.

**When to choose Payment Links over the Payment Element:**

- Lowest possible integration effort: a salesperson, marketing site, or invoice can paste a link with zero frontend code.
- The catalog is stable and the team is comfortable managing offerings in the Dashboard or via a small set of API calls, rather than dynamically generating checkout on every visit.
- The team can accept Stripe's hosted-page UX in exchange for not building or maintaining checkout themselves.

**When to stay on the Payment Element:**

- Checkout is part of a tightly designed in-product flow and the team needs full UX control (custom layout, embedded steps, branded interactions beyond Stripe's appearance API).
- Per-session pricing logic is highly dynamic (e.g., personalized discounts computed per visit) and pre-creating links is impractical.
- Order data (line items, custom fields, conditional logic) is computed at request time from systems the Dashboard cannot reach.

This is a UX-vs.-control tradeoff, review with `sub-agents/solution-architect.md`, `sub-agents/frontend-developer.md`, and `sub-agents/head-of-payments.md` when both options are on the table. Many teams use both: Payment Links for ad hoc sales, invoices, and marketing surfaces; Payment Element for the main product's in-app checkout.

#### Dashboard-created links (recommended first step)

For most teams the first Payment Link is created in the Dashboard: pick a Product/Price, set after-payment behavior (redirect URL, confirmation page), set inventory limits or expiry if needed, and copy the resulting URL. This is the right place to start because it surfaces every available option in one screen and produces a working link in minutes, without code.

Dashboard-created links emit the same webhook events as API-created links (`checkout.session.completed`, `payment_intent.succeeded`, `customer.subscription.created` for subscriptions). The integration's webhook handler treats both paths uniformly; only the creation path differs.

#### API-created links (programmatic)

When Payment Links need to be generated programmatically (e.g., one link per quote, per order, per customer), use the API. The link references existing Prices, so create the catalog first via [`products-and-prices.md`](products-and-prices.md).

```javascript
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const paymentLink = await stripe.paymentLinks.create({
  line_items: [
    { price: 'price_1NXYZpro_plan_monthly_usd', quantity: 1 },
  ],
  after_completion: {
    type: 'redirect',
    redirect: { url: 'https://example.com/order/complete?session={CHECKOUT_SESSION_ID}' },
  },
  metadata: { quoteId: 'q_12345' },
});

// paymentLink.url is the shareable URL to send to the customer.
```

The `{CHECKOUT_SESSION_ID}` placeholder is substituted by Stripe at redirect time; the integration can then retrieve the `Checkout Session` to look up the resulting PaymentIntent or Subscription and reconcile against the original quote via `metadata.quoteId`.

Common parameters worth knowing at scoping time:

- `line_items`: one or more `{ price, quantity }` entries. For a recurring Price, this creates a Subscription on completion rather than a one-time PaymentIntent.
- `after_completion`: `redirect` to a URL the team controls, or `hosted_confirmation` to show a Stripe-hosted confirmation message.
- `allow_promotion_codes`: whether the customer can enter a promotion code at checkout.
- `automatic_tax: { enabled: true }`: enables Stripe Tax calculation on the link, see [`tax.md`](tax.md) for prerequisites (registrations, `tax_code` on Products, `tax_behavior` on Prices).
- `phone_number_collection`, `shipping_address_collection`, `custom_fields`: data to collect at checkout.
- `restrictions.completed_sessions.limit`: cap the number of times the link can be used (e.g., a one-shot link for a single customer).

#### Connect: `on_behalf_of` and per-account Payment Links

For platforms using Connect (see [`platform.md`](platform.md)), there are two API patterns depending on which account the link should be created on:

**Pattern A: platform-account link with `on_behalf_of` and `transfer_data`.** The link lives on the platform account but settles funds to the connected account. Use this when the platform wants centralized control over link creation, catalog, and analytics, while the connected account receives the funds.

```javascript
const paymentLink = await stripe.paymentLinks.create({
  line_items: [{ price: 'price_1NXYZmarketplace_item', quantity: 1 }],
  on_behalf_of: connectedAccountId,
  transfer_data: { destination: connectedAccountId },
  application_fee_amount: 500, // platform keeps $5.00
  after_completion: {
    type: 'redirect',
    redirect: { url: 'https://platform.example.com/order/complete?session={CHECKOUT_SESSION_ID}' },
  },
});
```

`on_behalf_of` makes the connected account the merchant of record for settlement currency, fee determination, and statement descriptor purposes (see Charge-type currency determination in [`platform.md`](platform.md)). `transfer_data.destination` routes the funds to the connected account, less `application_fee_amount`.

**Pattern B: link created directly on the connected account.** The link lives on the connected account itself. Use the `Stripe-Account` header (or the SDK's per-call account option) to scope the call. This fits the Standard account type, where the connected account manages its own catalog and dashboard, and platforms with embedded components.

```javascript
const paymentLink = await stripe.paymentLinks.create(
  {
    line_items: [{ price: 'price_1NXYZconnected_account_item', quantity: 1 }],
    application_fee_amount: 500,
    after_completion: { type: 'hosted_confirmation' },
  },
  { stripeAccount: connectedAccountId },
);
```

The `Price` referenced here must exist on the connected account, not the platform account. This is the most common source of confusion when moving from Pattern A to Pattern B: the catalogs are separate.

The choice between A and B is a structural one, review with `sub-agents/solution-architect.md` (which account owns the catalog and reporting), `sub-agents/frontend-developer.md` (where the link surface lives and who customizes it), and `sub-agents/head-of-payments.md` (merchant-of-record, statement descriptor, and dispute-handling implications).

#### Webhook handling for Payment Links

Payment Links create a `Checkout Session` behind the scenes, which then drives the underlying PaymentIntent or Subscription. The events to handle:

- `checkout.session.completed`: fired once when the customer completes checkout. The session object includes the resulting `payment_intent` or `subscription` ID, and any `metadata` set on the link or session.
- `payment_intent.succeeded` / `payment_intent.payment_failed`: the same events as the core flow in this file; treat them as the source of truth for one-time payment outcomes.
- `customer.subscription.created` / `invoice.paid`: for recurring Prices, the same Billing events documented in [`billing.md`](billing.md).

Reconcile back to internal records via `metadata` set on the link at creation time (e.g., `metadata.quoteId`, `metadata.orderId`). The Checkout Session's `metadata` is copied through from the link.

#### Common Payment Links pitfalls

1. **Mixing platform-account and connected-account catalogs.** A link created on the platform account cannot reference a Price that exists only on a connected account, and vice versa. Decide which account owns the catalog before generating links at scale.

2. **Forgetting that `automatic_tax: { enabled: true }` requires upstream setup.** Tax registrations, Product `tax_code`, and Price `tax_behavior` must all be in place. See [`tax.md`](tax.md) for the full prerequisites.

3. **Treating the redirect as the source of truth for completion.** The customer's browser landing on the redirect URL does not guarantee the payment succeeded (the customer can navigate away mid-redirect, or 3DS may still be resolving). Use the webhook events as the source of truth, the same principle as the Payment Element flow.

4. **Hardcoding link URLs in templates.** API-created links can be regenerated, but Dashboard-created links have stable URLs that should be treated as integration constants: changing them silently breaks every place they were pasted. Store dashboard link URLs in a single source the team can update.

5. **Skipping `restrictions.completed_sessions.limit` for one-shot links.** A link intended for a single customer can be forwarded; if a single use is the intent, cap it explicitly rather than relying on social convention.

### Not recommended for new integrations: Charges API

The older `Charges` API (`stripe.charges.create`) does not support SCA/3DS2 flows well and is largely superseded by Payment Intents. Do not use it for new integrations targeting markets where SCA applies (e.g., EEA, UK, India).

## Code Examples

### 1. Create a PaymentIntent (server-side, Node.js)

```javascript
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post('/create-payment-intent', async (req, res) => {
  const { amount, currency, orderId } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,        // amount in the smallest currency unit, e.g., cents for USD/EUR
    currency,      // e.g., 'usd', 'eur'
    automatic_payment_methods: { enabled: true },
    metadata: { orderId },
  }, {
    idempotencyKey: `pi_create_${orderId}`,
  });

  res.json({ clientSecret: paymentIntent.client_secret });
});
```

Note the `idempotencyKey`: if the client retries this request (e.g., due to a network timeout), Stripe returns the original PaymentIntent instead of creating a duplicate. See `sub-agents/backend-developer.md` review criteria on idempotency.

### 2. Collect payment with the Payment Element (frontend, React)

```jsx
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: 'https://example.com/order/complete',
      },
    });

    // confirmPayment redirects on success for some payment methods.
    // This code only runs if there was an immediate error
    // (e.g., card declined synchronously, validation error).
    if (error) {
      setErrorMessage(error.message);
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {errorMessage && <div role="alert">{errorMessage}</div>}
      <button disabled={!stripe || isProcessing}>
        {isProcessing ? 'Processing...' : 'Pay'}
      </button>
    </form>
  );
}

function App({ clientSecret }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  );
}
```

### Elements customization

The Payment Element can be customized without abandoning the prebuilt-component model:

- **`paymentMethodOrder`**: override the default order in which payment methods are displayed, pass a list of payment method type names in the desired order.
- **`wallets`**: by default, the Payment Element shows a wallet button (Apple Pay/Google Pay) when the PaymentIntent supports `card` and the customer's device/browser supports a wallet. Set `wallets: { default: 'never' }` to hide wallet buttons, e.g., if the checkout already has a separate Express Checkout element.
- **`fields`**: suppress fields the Payment Element would otherwise collect, when that data is already collected elsewhere in the checkout flow:

```javascript
const paymentElement = elements.create('payment', {
  fields: {
    billingDetails: {
      address: { postalCode: 'never', country: 'never' },
    },
  },
});
```

- **Appearance API**: customize the visual presentation via `appearance` passed to `stripe.elements()`. Three layers, applied together:
  - **Themes**: pick a prebuilt theme close to the site's design (`stripe`, `night`, `flat`, `none`) as a starting point.
  - **Variables**: broadly customize via CSS-variable-like settings (`fontFamily`, `colorPrimary`, etc.), referenceable with `var(--myVariable)` syntax.
  - **Rules**: fine-grained, CSS-like selectors mapping to CSS properties for individual components and states, for full control after themes/variables.

```javascript
const appearance = {
  theme: 'stripe',
  variables: { colorPrimary: '#0a2540', fontFamily: 'Roboto, sans-serif' },
  rules: {
    '.Input': { border: '1px solid #e6e6e6' },
    '.Input:focus': { border: '1px solid #0a2540' },
  },
};
const elements = stripe.elements({ appearance, clientSecret });
```

### 3. Webhook handler (Node.js / Express)

```javascript
// IMPORTANT: this route must receive the raw request body,
// not JSON-parsed, for signature verification to work.
app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        // Look up order by paymentIntent.metadata.orderId
        // Mark order as paid (idempotently, this event may be redelivered)
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        // Mark order as payment failed, notify customer
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        // Update order with refund status
        break;
      }
      default:
        // Unhandled event type, ignore
        break;
    }

    // Respond quickly with 2xx, do heavier processing async if needed
    res.json({ received: true });
  }
);
```

### 4. Issue a refund (server-side)

```javascript
app.post('/refund', async (req, res) => {
  const { paymentIntentId, amount, orderId } = req.body; // amount optional = full refund

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount, // omit for full refund
  }, {
    idempotencyKey: `refund_${orderId}_${amount ?? 'full'}`,
  });

  res.json({ refundId: refund.id, status: refund.status });
});
```

## Common Implementation Pitfalls

1. **Trusting the frontend confirmation result as the source of truth.** `confirmPayment` resolving without an error does not always mean the payment fully succeeded (e.g., the customer may need to complete an authentication redirect). Always treat webhooks as the source of truth for order fulfillment.

2. **Zero-decimal currencies.** Currencies like JPY, KRW are zero-decimal, do not multiply by 100. Sending `amount: 1000` for JPY means 1000 yen, not 10 yen. [Unverified] Confirm the current full list of zero-decimal currencies at https://stripe.com/docs/currencies#zero-decimal

3. **Missing or misconfigured webhook signing secret per environment.** Each webhook endpoint (test, live, and each `stripe listen` session) has its own signing secret. Using the wrong one causes all signature verifications to fail silently (every event gets rejected with a 400).

4. **Parsing the webhook body as JSON before verification.** Frameworks that auto-parse JSON bodies (e.g., a global `express.json()` middleware) will break signature verification, the webhook route needs the raw body. Scope the raw body parser to just the webhook route.

5. **Not using idempotency keys on payment creation.** A network timeout that causes a client retry, without an idempotency key, can create two PaymentIntents (and potentially two charges) for one order.

6. **Forgetting `automatic_payment_methods` or manually listing payment method types and letting them drift from Dashboard configuration.** Using `automatic_payment_methods: { enabled: true }` keeps the integration in sync with whatever payment methods are enabled in the Stripe Dashboard, without code changes.

7. **Not handling `requires_action` status for SCA.** If not using the Payment Element/`confirmPayment` (e.g., a fully custom flow), the integration must explicitly handle the `requires_action` PaymentIntent status to trigger 3DS authentication. The Payment Element handles this automatically.

8. **Storing card details instead of PaymentMethod/Customer IDs.** For repeat customers, attach a `PaymentMethod` to a `Customer` object and store the Stripe Customer ID, never store card numbers.

9. **Assuming PaymentIntents expire on their own.** A PaymentIntent created but never completed (e.g., the customer abandons checkout) stays in `requires_payment_method`/`requires_confirmation` indefinitely; Stripe does not auto-cancel it. Run a periodic job that cancels stale checkout PaymentIntents past a reasonable timeout, otherwise reconciliation can later show an unexpected late payment against an order the team considered abandoned.

10. **Under-sizing the column used to store Stripe object IDs.** Stripe object IDs (PaymentIntent, Charge, Customer, etc.) can be up to 255 characters and are case-sensitive. Use a sufficiently long column (e.g., `VARCHAR(255)`) with a case-sensitive collation, a case-insensitive collation can cause distinct IDs to collide on lookup.

11. **Blocking a card brand or network only in frontend code.** If the business wants to exclude a card brand (e.g., a specific network), enforce it server-side, when validating the PaymentMethod before confirming, and via a Radar rule (see `psps/stripe/fraud-and-disputes.md`). A frontend-only check (e.g., on the Element's `change` event) is cosmetic and trivially bypassed by a customer who submits anyway.

## Additional Payment Methods

The Payment Element (see above) handles these automatically for most integrations. The notes below cover behavior specific to each method that is easy to miss when building custom flows, handling webhooks, or reasoning about refund/capture timing.

### PayPal

- **Account topology**: there should be a 1:1 relationship between a Stripe account and a PayPal account. If the business operates multiple Stripe accounts (e.g., one per market), each needs its own connected PayPal account.
- **`invoice_id` must be unique**: when passing an `invoice_id` for a PayPal-funded PaymentIntent, do not reuse the same value across multiple transactions, PayPal rejects the payment if it sees a duplicate.
- **Capture window is short**: an authorized PayPal payment must be captured within a shorter window than typical cards. [Unverified: confirm current capture window against https://stripe.com/docs/payments/paypal. Recent docs have stated 3 days.]
- **Refunds always flow PayPal -> Stripe**, never the reverse. [Unverified: confirm current refund window against the PayPal payment-method doc. Recent docs have stated 180 days from the original payment.]
- **Statement descriptors are not customizable**: the customer sees the merchant's PayPal account name on their PayPal statement, not the business's Stripe statement descriptor.
- **Saved PayPal PaymentMethods require a mandate**: when confirming a PaymentIntent with a previously saved PayPal PaymentMethod, include `mandate_data[customer_acceptance]`, otherwise confirmation fails.

### Klarna

- **Capture window is long**: an authorized Klarna payment can be captured well after authorization, longer than PayPal's window. [Unverified: confirm current capture window against https://stripe.com/docs/payments/klarna. Recent docs have stated 28 days.]
- **Redirect timeout**: the customer has a bounded window to complete the Klarna redirect flow. If they do not, the associated PaymentMethod is detached and the PaymentIntent must be retried with a new PaymentMethod. [Unverified: confirm current timeout against the Klarna doc. Recent docs have stated roughly 1 hour.]
- **European customer prefill**: Klarna typically requires date of birth and full billing address details to be prefilled for EU customers, collect these before redirecting.
- **PaymentIntent status maps to specific webhook events**: track the PaymentIntent status transitions (`requires_action` during redirect, `processing` while Klarna confirms, `succeeded`/`payment_failed` on completion) via webhooks rather than the redirect return alone, the same "webhooks are the source of truth" principle as the core flow above.
- **Line items**: passing line items to Klarna via the PaymentIntents API is a standard (GA) feature and does not require a beta API version header. [Unverified] Older guidance referenced a 25-item limit and a `line_items_beta=v1` header, both appear to be legacy beta-era constraints. Confirm current line item limits (reported as up to 100-1,000 depending on integration path) at https://stripe.com/docs/payments/klarna

### Bancontact and iDEAL

- Both are **single-use** payment methods: the resulting PaymentMethod is consumed after one confirmation attempt and cannot be attached to a `Customer` for future use.
- **iDEAL requires the `eur` currency**, confirm the PaymentIntent's currency before offering iDEAL.
- **Bancontact** supports a `payment_method_options.bancontact.preferred_language` parameter (`fr`, `nl`, or `de`), useful for Belgian customers where the redirect page language should match the storefront locale.

### Stablecoin payments via Optimized Checkout

When enabled on the account, supported stablecoins (USDC and others, per region and per Stripe agreement) surface in the Payment Element, Checkout Sessions, and Payment Links automatically under `automatic_payment_methods: { enabled: true }`. No per-method integration is required on the acceptance side; what changes is the post-acceptance behavior:

- **Settlement mode**: the team's account is configured to settle in fiat (Stripe converts on-chain at acceptance) or to keep the stablecoin balance (settle-in-stablecoin), per market availability. This is account-level, not per-PaymentIntent.
- **Refunds**: typically routed back to the customer's wallet on-chain, with different windows and finality semantics from card refunds. Support and operations processes need to handle this path.
- **No card-network dispute path**: on-chain payments do not have chargebacks, so the dispute model from `fraud-and-disputes.md` does not apply to stablecoin payments. Stripe handles fraud on the acceptance side as merchant of record; the team's support process needs a separate path for stablecoin payment disputes.
- **Reconciliation cadence differs from card.** Confirmation-window timing is on-chain rather than card-network-driven, see `reports.md`.

The cross-cutting model (regulatory framing, supported assets per surface, settle-in-stablecoin vs. settle-in-fiat, Treasury and Issuing pairings, Open Issuance) is in [`stablecoins.md`](stablecoins.md). Load it when stablecoin acceptance is in scope for the engagement.

This is a `sub-agents/head-of-payments.md`, `sub-agents/frontend-developer.md`, and `sub-agents/finance-treasury.md` scoping conversation before it is an integration one. The integration code is mostly a flag flip; the operational implications are not.

## Multi-Capture

Multi-Capture is the pattern where a single authorized PaymentIntent is captured in multiple, separate captures (e.g., as different parts of an order ship), instead of one capture for the full amount.

Availability and pricing-model gating change over time and per account. Confirm via the Verification References block (check `payment_method_options.card.multi_capture_supported` on a created PaymentIntent for the connected account, and the canonical doc for any account-level enablement step the team needs to request).

1. Create the PaymentIntent with `capture_method: 'manual'` and confirm it (`confirm: true`) to authorize the full amount. `capture_method: 'manual'` is required, automatic capture does not support multi-capture.
2. For each partial capture, call `paymentIntents.capture` with `amount_to_capture` set to the portion being captured and `final_capture: false`, this leaves the remaining authorized amount available for further captures.
3. For the last capture, either set `final_capture: true` (capturing the specified amount and releasing any remainder), or call `capture` with `amount_to_capture: 0` and `final_capture: true` to release the entire remaining authorization without capturing more.

```javascript
// Step 1: authorize the full amount
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000,
  currency: 'usd',
  capture_method: 'manual',
  confirm: true,
  payment_method: paymentMethodId,
}, {
  idempotencyKey: `pi_create_${orderId}`,
});

// Step 2: capture the first shipment (partial)
await stripe.paymentIntents.capture(paymentIntent.id, {
  amount_to_capture: 4000,
  final_capture: false,
});

// Step 3: capture the final shipment and release any remainder
await stripe.paymentIntents.capture(paymentIntent.id, {
  amount_to_capture: 6000,
  final_capture: true,
});
```

Limits and constraints:

- [Unverified: confirm against https://stripe.com/docs/payments/multicapture] A per-PaymentIntent capture-count limit applies. Recent docs have stated 50.
- [Unverified: confirm against https://stripe.com/docs/payments/multicapture] Multi-Capture is supported only on specific networks. Recent docs have listed Visa, Mastercard, and American Express, and excluded Cartes Bancaires. Confirm before committing to a flow that depends on it.
- Once any refund has been issued against the PaymentIntent, **no further captures are possible**, plan remaining fulfillment around an unlinked refund or a new authorization instead.
- Before relying on multi-capture for a given PaymentMethod, check `payment_method_options.card.multi_capture_supported` on the PaymentIntent to confirm support, this also serves as a per-account/per-pricing-model capability check (see `sub-agents/solution-architect.md` for how to verify this during scoping).

### Cartes Bancaires and "ship in installments"

Because Cartes Bancaires does not support multi-capture, a single authorization followed by multiple partial captures is not possible for CB cards. For businesses shipping an order in multiple installments (e.g., one product per shipment), the practical alternative is **n separate authorizations**, one per shipment, instead of one authorization with n captures.

Timing guidance for this pattern, based on card-network experience:

- The 3DS/SCA authentication performed for the **total order amount** at checkout covers each subsequent authorization for **roughly 30 days** against cardholder disputes, the cardholder cannot contest these later authorizations as unrecognized, but this does not guarantee the funds will actually be available at authorization time.
- To limit the risk of disputes, aim for an **average gap of around 10 days** between successive authorizations. Waiting longer is possible but increases the chance the cardholder no longer has sufficient funds, in which case the shipment of the corresponding item needs to be held until the cardholder resolves the issue.

This is a pattern-fit decision with liability and operational implications, review with `sub-agents/solution-architect.md` (integration pattern) and `sub-agents/fraud-officer.md` (dispute-risk tradeoffs) when "ship in installments" is in scope for CB-heavy markets (e.g., France).

## Extended Authorization

When shipping physical goods, authorization and capture are often separated in time (the customer is authorized at checkout, captured when the order ships). By default, authorized funds are guaranteed for a fixed window; after expiry, Stripe sends a `charge.expired` event, marks the charge accordingly, and cancels the PaymentIntent. [Unverified: confirm the current default window and expiry behavior against https://stripe.com/docs/payments/extended-authorization. Recent docs have stated 7 days.]

For businesses that need a capture window longer than the default, four options exist, each with different liability and UX tradeoffs. Per-network windows and mandate durations below are point-in-time, confirm against the Verification References block before relying on them:

| Option | How it works | Liability shift | Key tradeoffs |
|---|---|---|---|
| **1. Re-authorization after expiry** | Let the original authorization expire, then create a new authorization (off-session if the PaymentMethod was saved) when ready to ship. | With the customer (cardholder), off-session payments do not carry the liability shift. | No date limit, but may trigger 3DS on the new auth, and the business pays for every authorization attempt. If off-session fails, the cardholder must come back on-session. |
| **1.1 Re-auth + capture at delivery** | Variation of Option 1: perform the new authorization when goods are ready to ship, and capture immediately on delivery rather than capturing earlier. | With the customer, same as Option 1. | Reduces risk for higher-value goods by tying capture closer to delivery, but inherits Option 1's tradeoffs (possible 3DS, no guaranteed funds, on-session fallback on failure). |
| **2. Delayed authorization via single-use mandate** | Instead of authorizing at checkout, collect a single-use mandate and create the authorization + capture later, off-session, when ready to ship. [Unverified: confirm current mandate validity window.] | With the issuer (similar to "save card for later"). | The original 3DS authentication is preserved, no re-authentication needed at capture. Confirms the PaymentMethod is valid but not that funds are available, failures require bringing the cardholder back on-session. |
| **3. Extended Authorization** | Extend the authorization window itself per network. [Unverified: confirm current per-network windows. Recent docs have stated 28 days for Visa and 30 days for Mastercard.] | With the issuer. | Guaranteed funds, no extra code or re-authentication needed. Does **not** work for Cartes Bancaires, and does not support captures beyond the per-network maximum. |

This is a decision point with both technical and risk implications, review with `sub-agents/solution-architect.md` (which option fits the order-to-shipment timeline and existing integration pattern) and `sub-agents/fraud-officer.md` (liability-shift and dispute-rate implications of each option) before committing to one for businesses with fulfillment windows beyond 7 days.

## Statement Descriptors

The statement descriptor is what appears on the customer's card statement for a charge, getting it right reduces "I don't recognize this charge" disputes (see `psps/stripe/fraud-and-disputes.md` Fraud Prevention Best Practices).

- **Format constraints**: [Unverified: confirm current length range and disallowed characters against https://stripe.com/docs/payments/account/statement-descriptors. Recent docs have stated 5-22 characters, at least one letter, and disallowed `< > \ ' " *`.]
- **Static vs. dynamic descriptors**: a single static descriptor works for businesses with one brand/storefront. A **dynamic descriptor** (a fixed account-level prefix plus a per-transaction suffix, e.g., the order ID or a sub-brand name) helps customers recognize charges from businesses with multiple brands, marketplaces, or distinct product lines, at the cost of slightly more integration work to populate the suffix per transaction.
- Choose the descriptor text to closely match the brand name customers recognize from checkout, mismatches between the checkout brand and the statement descriptor are a common source of avoidable disputes.

## Relevant Stripe Documentation

- Payment Intents overview: https://stripe.com/docs/payments/payment-intents
- Payment Element: https://stripe.com/docs/payments/payment-element
- Accept a payment (Node.js quickstart): https://stripe.com/docs/payments/accept-a-payment
- Webhooks: https://stripe.com/docs/webhooks
- Idempotent requests: https://stripe.com/docs/api/idempotent_requests
- Refunds: https://stripe.com/docs/refunds
- Currencies (including zero-decimal): https://stripe.com/docs/currencies
- Strong Customer Authentication (SCA): https://stripe.com/docs/strong-customer-authentication
- PayPal payment method: https://stripe.com/docs/payments/paypal
- Klarna payment method: https://stripe.com/docs/payments/klarna
- Bancontact payment method: https://stripe.com/docs/payments/bancontact
- iDEAL payment method: https://stripe.com/docs/payments/ideal
- Multi-Capture: https://stripe.com/docs/payments/multicapture
- Extended Authorization and incremental authorization: https://stripe.com/docs/payments/extended-authorization
- Statement descriptors: https://stripe.com/docs/payments/account/statement-descriptors
- Elements Appearance API: https://stripe.com/docs/elements/appearance-api
- Payment Element vs. Card Element: https://stripe.com/docs/payments/payment-card-element-comparison
- Payment Links overview: https://stripe.com/docs/payment-links
- Payment Links API: https://stripe.com/docs/api/payment_links
- Products and Prices catalog used by Payment Links: see `psps/stripe/products-and-prices.md`
- Stablecoin payments (cross-cutting model): see `psps/stripe/stablecoins.md`
- Fraud, 3DS, and disputes: see `psps/stripe/fraud-and-disputes.md`
- Reporting and reconciliation: see `psps/stripe/reports.md`
