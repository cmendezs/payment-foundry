# Stripe: Billing

Covers Stripe Billing: subscriptions, invoicing, pricing models, customer portal, dunning, and the supporting Customer/Product/Price/Invoice object model. For recurring or usage-based revenue.

## Verification References

Use these pointers during `/validate-context` and before generating final integration code for this product line. The product-line file below describes stable patterns; finalization windows, `incomplete` expiry, dunning options, and per-feature availability must be re-verified against the sources here.

- **Canonical docs:**
  - https://stripe.com/docs/billing covers Billing overview and the core object model
  - https://stripe.com/docs/api/subscriptions covers Subscription fields, statuses, and supported lifecycle operations
  - https://stripe.com/docs/billing/invoices/workflow covers Invoice states, finalization, and `auto_advance` behavior
  - https://stripe.com/docs/billing/subscriptions/subscription-schedules covers schedule semantics and release behavior
  - https://stripe.com/docs/billing/subscriptions/trials covers free trial mechanics and card-network notification rules
  - https://stripe.com/docs/billing/subscriptions/coupons covers coupon shape and duration semantics
  - https://stripe.com/docs/billing/subscriptions/integrating-customer-portal covers Customer Portal capabilities
  - https://stripe.com/docs/billing/testing/test-clocks covers Test Clocks
- **API Changelog:** https://stripe.com/docs/upgrades, watch for changes to Subscription statuses, usage-record reporting (action: `set` / `increment` / new metering APIs), and dunning configuration.
- **Stripe MCP hints (if connected):**
  - To check the current Subscription status enumeration and supported state transitions, query the Subscriptions API reference.
  - To check whether a new metered-usage API or a replacement is in effect on the connected account, query the API Changelog by topic and the account capabilities.
  - To check current Customer Portal feature flags and configurability, query the relevant doc page.
- **What to re-verify before relying on this file:**
  - The `incomplete` to `incomplete_expired` transition window.
  - The draft-to-finalized invoice window for subscription invoices.
  - Current usage reporting API (the metered `createUsageRecord` shape and any successor API).
  - Dunning options available in the Dashboard and any changes to default behavior.
  - Card-network trial-notification compliance requirements.
  - Customer Portal capabilities currently exposed and the customization surface.

## Core Objects

Stripe Billing builds on a small set of objects that fit together as follows:

- **Customer**: the end customer being billed. Holds default payment method, billing address, tax IDs, and a balance (see Customer Balance below).
- **Product**: a product or service the business offers (e.g., "Pro Plan"). Mostly descriptive, prices attach to it.
- **Price**: the central object in Billing. Defines an amount, currency, and (for recurring prices) a billing interval and usage type. A single Product can have multiple Prices (e.g., monthly vs. annual, or different currencies).
- **Subscription**: links a Customer to one or more Prices via Subscription Items, and drives recurring billing.
- **Invoice**: the amount due for a billing period. Tracks payment status from draft through paid (or otherwise resolved). Subscriptions generate invoices automatically.
- **PaymentIntent**: each invoice that requires payment creates (or reuses) a PaymentIntent to actually collect funds, following the same confirmation/webhook model described in `psps/stripe/payments.md`.

The relationship chain is: **Product -> Price -> Subscription -> Invoice -> PaymentIntent**. A Subscription Item ties a Subscription to a specific Price (and optional quantity), and Invoice Items can add one-off charges (e.g., setup fees, proration adjustments) onto an invoice alongside the recurring line items.

## Code Examples

### 1. Create a recurring Price

```javascript
const price = await stripe.prices.create({
  unit_amount: 3000, // smallest currency unit (cents)
  currency: 'usd',
  product: 'prod_G5C2dR79WKS6AU',
  recurring: {
    interval: 'month',
    interval_count: 1,
    usage_type: 'licensed', // or 'metered' for usage-based billing
  },
});
```

`usage_type: 'licensed'` means the price is charged based on the quantity set on the subscription item. `usage_type: 'metered'` means the price is charged based on usage records reported during the billing period (see "Per-seat / usage-based pricing" below).

### 2. Create a Subscription

```javascript
const subscription = await stripe.subscriptions.create({
  customer: 'cus_aBcD1234FgHi',
  items: [{ price: 'price_1g2hjkbv324' }],
  expand: ['latest_invoice.payment_intent'],
}, {
  idempotencyKey: `sub_create_${customerId}`,
});

// If the initial invoice requires payment, confirm it via the
// expanded PaymentIntent's client_secret using the Payment Element,
// the same confirmation flow as a one-time payment.
const clientSecret = subscription.latest_invoice.payment_intent.client_secret;
```

### 3. Add a one-time fee alongside a subscription

```javascript
const subscription = await stripe.subscriptions.create({
  customer: 'cus_G5DGDsOpYw8Dj5',
  items: [{ price: 'price_HGEB5vsvNlHsVm' }], // recurring price
  add_invoice_items: [{ price: 'price_1GqKi4KsXGd3iMP2g' }], // one-time setup fee
});
```

The one-time item is billed once on the next invoice (e.g., the first invoice for a new subscription) rather than every period.

### 4. Report usage for a metered price

```javascript
await stripe.subscriptionItems.createUsageRecord(
  subscriptionItemId,
  {
    quantity: usageQuantity,
    timestamp: Math.floor(Date.now() / 1000),
    action: 'set', // or 'increment' to add to the existing usage for the period
  },
  { idempotencyKey: usageIdempotencyKey },
);
```

The subscription is billed for the reported usage at the end of the billing period. Always pass an idempotency key, usage records are easy to accidentally double-report on retry.

### 5. Bill a business customer on invoice terms (`send_invoice`)

```javascript
const subscription = await stripe.subscriptions.create({
  customer: 'cus_aBcD1234FgHi',
  items: [{ price: priceId }],
  collection_method: 'send_invoice',
  days_until_due: 30,
  expand: ['latest_invoice.payment_intent'],
});
```

With `collection_method: 'send_invoice'` (instead of the default `charge_automatically`), Stripe generates and emails the invoice to the customer rather than attempting to charge a saved payment method, useful for business customers paying on net terms.

## Subscription States

The Subscription object's `status` field reflects its current lifecycle state:

- **`incomplete`**: the subscription was created but the initial payment has not yet succeeded (e.g., requires authentication or the PaymentIntent is still `requires_action`/`requires_payment_method`). If payment is not completed within the expiry window, the subscription moves to `incomplete_expired`. [Unverified: confirm current window against https://stripe.com/docs/api/subscriptions. Recent docs have stated 23 hours.]
- **`incomplete_expired`**: the initial payment failed and was not completed in time. The subscription will not generate further invoices.
- **`trialing`**: the subscription is in a free trial period, no payment has been collected yet.
- **`active`**: the subscription is current and paid (or in trial with `trial_end` in the future and `active` semantics depending on configuration).
- **`past_due`**: the latest invoice payment failed but Stripe is still retrying (per Smart Retries / dunning settings).
- **`canceled`**: the subscription has ended, either by explicit cancellation or because retries were exhausted and the dunning setting is "cancel the subscription".
- **`unpaid`**: retries were exhausted and the dunning setting is "mark the subscription as unpaid" (subscription stays open but is not active).

## Invoice States

| State | Description | Possible actions |
|---|---|---|
| `draft` | Initial state of all invoices. Can still be modified (line items added/removed). | Finalize to move to `open`, or delete. |
| `open` | Finalized, awaiting customer payment. Can no longer be modified. | Send, void, mark uncollectible, or pay. |
| `paid` | The invoice has been paid. | - |
| `void` | The invoice was created in error and has been voided. | - |
| `uncollectible` | Unlikely to be paid, treated as bad debt for reporting. | Void or pay. |

`auto_advance` controls whether Stripe automatically progresses an invoice through these states (finalizing, attempting payment) or whether the integration must drive the transitions itself.

For subscriptions, each billing cycle automatically creates a `draft` invoice, then **finalizes it after a fixed delay** (no further line items can be added after finalization) before attempting payment. This window is the opportunity to add invoice items (e.g., metered usage corrections, one-off charges) to that period's invoice. [Unverified: confirm current delay against https://stripe.com/docs/billing/invoices/workflow. Recent docs have stated roughly one hour.]

## Common Billing Scenarios

### New subscription creation

1. The Customer object is created in Stripe.
2. The Subscription is created, and Stripe attempts to process the initial payment for it at the same time.
3. **If the initial payment fails, both the subscription and its associated invoice creation fail** (the subscription is created in `incomplete` status pending a successful payment, see Subscription States above). Do not assume subscription creation always succeeds.
4. If the initial payment succeeds, the subscription and invoice objects are generated normally, and Stripe emails the paid invoice (PDF) to the customer.

### Renewal at the end of a billing period

1. As the subscription approaches its renewal date, an `invoice.upcoming` event is sent (optionally paired with Stripe's reminder emails).
2. At the end of the current billing period, a draft invoice is generated.
3. Roughly **one hour** after creation, the invoice is finalized (no further changes allowed) and Stripe attempts to collect payment.
4. On success, Stripe emails the paid invoice (PDF) to the customer.

### Plan changes (upgrade/downgrade)

- **Immediate changes** are natively supported: the customer moves to the new price right away and pays the new price starting next billing cycle. To charge the price difference immediately on an upgrade within the same cycle, generate an invoice after making the change.
- **Changes effective at renewal** are handled via Subscription Schedules (see below), not by the base Subscription API.
- If a change involves moving from non-paid to paid, or from monthly to annual, **billing happens immediately**. If that immediate payment fails, the subscription change request also fails and the subscription remains unchanged.
- Proration amounts are calculated to the second, based on the time of the API call relative to the current billing period's start/end. To pin proration to a specific point in time (e.g., for more predictable amounts), pass `proration_date`. This only affects how the price is calculated, not when the subscription's status actually changes.

### Changing the renewal date

- Setting `billing_cycle_anchor` to "now" is fully supported natively.
- Subscription Schedules support moving the renewal date to an arbitrary future or past date.
- Without Subscription Schedules:
  - **Later renewal date**: apply a free trial ending on the new (later) renewal date, set `prorate: false`, and create an invoice item to charge for the extra days at the current term's price. A $0 invoice is generated for the trial period.
  - **Earlier renewal date**: apply a free trial ending on the new (earlier) renewal date, set `prorate: false`, and create a negative invoice item to credit the customer for unused time.

### Cancellation

- Immediate cancellation with a prorated credit: call `DELETE /v1/subscriptions/{sub_id}` with `prorate: true` and `invoice_now: true`. This generates an invoice that, once finalized (within an hour), places the prorated credit on the customer's balance.
- The `customer.subscription.deleted` event fires immediately on cancellation, this is the trigger to deprovision the associated services.

### Failed renewal payment

When Stripe exhausts its retry attempts (Smart Retries) on an automatically-collected invoice, the subscription transitions according to the account's dunning configuration. Options are:

1. Cancel the subscription.
2. Mark the subscription as `unpaid`.
3. Leave the subscription as-is (continue retrying / leave `past_due`).

Decide and configure this behavior deliberately, the default may not match the business's churn/dunning policy. See `sub-agents/finance-treasury.md` for revenue-recognition implications of each option.

### Internal credit systems

To apply internal credits (e.g., goodwill credits, loyalty programs) to a customer's billing:

- Adjust the Customer's `balance` field directly via the Update Customer API, or
- Create Customer Balance Transactions (preferred for an audit trail, see Customer Balance below), or
- Add invoice items to the customer or an upcoming invoice, applied on the next invoice.

## Additional Components

### Free trials

Set a default trial period on a Price in the Dashboard, or pass `trial_end` when subscribing a customer via the API. **Card network compliance requirements apply to trials** (free or discounted), including notifying the customer before the first real charge and providing an easy way to cancel. If using Stripe's free trial feature, the Dashboard's email settings can help manage this compliance for the team.

### Coupons

A coupon has:

- `id`: a unique identifier.
- `currency` and either `percent_off` or `amount_off`.
- `duration`: `once`, `forever`, or `repeating` (with a `duration_in_months`).
- `max_redemptions` and `redeem_by` (last date the coupon can be applied).

Duration is scoped per customer/subscription from the moment the coupon is applied. For example, a 4-month coupon applied to a monthly subscription discounts the first 4 invoices; applied to an annual subscription, it discounts the entire first year's invoice; applied to a weekly subscription, it discounts every invoice in the first 4 months.

### Customer Balance

Each customer has a `balance` (debit or credit) automatically applied to their next invoice. It can be adjusted directly via the Update Customer API, or by creating **Customer Balance Transactions**, which increment or decrement the balance by a specified amount. Because the balance is derived from an immutable ledger of these transactions, Customer Balance Transactions provide an audit trail (including metadata about which object created or consumed each adjustment), prefer this over direct `balance` edits when traceability matters.

### Customer Portal

A Stripe-hosted, prebuilt UI giving customers self-service control over their subscription:

- Upgrade, downgrade, or cancel a subscription.
- Update payment methods.
- View billing history.

Most integrations can stand up a working portal in under an hour. It is customizable (logo, title, brand/accent colors, links to terms of service and privacy policy).

## Subscription Schedules

Subscription Schedules let you predefine future changes to a subscription's lifecycle (phases): plan changes at renewal, scheduled price changes, or fixed-term subscriptions that transition to a different plan after N periods.

- Convert an existing subscription to a schedule-managed one by creating a schedule with `from_subscription` set to the subscription's ID.
- A schedule can be set to start at an arbitrary future time, or backdated to represent a subscription that already started.
- Once a subscription is schedule-managed, you cannot make changes to the subscription that would affect future phases already defined by the schedule. Other changes write immediately to the current phase.
- **Releasing a schedule**: if a schedule has an active phase, releasing it immediately disconnects the schedule from the subscription. After release, the subscription can be managed via the normal subscription endpoints with no further schedule-imposed restrictions.

## Per-seat and Usage-Based Pricing

### Per-seat (quantity-based)

```javascript
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'price_HGd7M3DV3IMXkC', quantity: seatCount }],
  expand: ['latest_invoice.payment_intent', 'plan.product'],
});
```

Simply pass `quantity` on the subscription item. Quantity-based prices can also support volume tiers and optional per-tier discounts, configured on the Price object.

### Usage-based (metered)

Use a Price with `recurring.usage_type: 'metered'` (see Code Example 1) and report usage during the period via `SubscriptionItem.createUsageRecord` (see Code Example 4). The subscription is billed for the accumulated usage at the end of the billing period.

## Hosted Solutions: Stripe Checkout for Billing

As an alternative to a custom Elements-based integration, **Stripe Checkout** provides a Stripe-hosted payment page that can create subscriptions directly, replacing the Elements integration for the checkout step.

- **Pros**: faster to integrate, secure and PCI-simplified (hosted by Stripe), customizable branding (logo, title, colors), can link to terms of service/privacy policy.
- **Cons**: not all Billing features are available through Checkout, and it is less customizable than a full custom integration.

This is a reasonable starting point for teams prioritizing time-to-market over UI control, revisit with `sub-agents/frontend-developer.md` if checkout customization needs grow.

## Testing

Stripe **Test Clocks** let you simulate the passage of time for subscriptions in test mode, useful for verifying renewals, mid-cycle plan changes, trial transitions, and multi-phase Subscription Schedules without waiting for real billing periods to elapse. Test Clocks only work in test mode. See `psps/stripe/testing-and-ops.md` for general test/live mode practices.

## Common Implementation Pitfalls

1. **Treating subscription creation as guaranteed to succeed.** If the initial payment fails, both the subscription and its invoice fail to be created in a usable state (the subscription sits in `incomplete`, see Subscription States). Do not provision access until the subscription reaches `active` (or `trialing`).

2. **Forgetting card-network trial compliance requirements.** Free or discounted trials require pre-notification before the first real charge and an easy cancellation path. Configure Stripe's Dashboard email settings if relying on Stripe's free trial feature, or implement equivalent notifications.

3. **Not handling `invoice.payment_failed` and dunning settings.** Without explicit handling, subscriptions can sit silently in `past_due` while Smart Retries run, or transition to `canceled`/`unpaid` in ways the business did not anticipate. Decide the dunning behavior deliberately (see "Failed renewal payment" above) and act on the relevant webhook events.

4. **Migrating existing subscriptions naively.** Subscribing migrated customers to new Stripe products immediately charges them, double-billing customers who already paid on the old system. Instead, delay the first Stripe charge to the customer's correct next billing date, either via `backdate_start_date` + `billing_cycle_anchor` (set to the next correct billing date) + `prorate: false`, or via a `trial_end` set to that date. For large customer bases, consider migrating in daily batches aligned to each customer's existing billing date. Review the migration approach and data model with `sub-agents/backend-developer.md`, and the timing/proration of the first Stripe-billed cycle with `sub-agents/finance-treasury.md`.

5. **Mismatched Price IDs between test and live mode.** When creating products and prices in live mode, manually set the Price IDs to match their test-mode counterparts, this keeps the integration code identical across environments instead of branching on environment-specific IDs.

6. **Using `account_balance`/Customer balance ad hoc without an audit trail.** Prefer Customer Balance Transactions over direct balance edits when crediting or debiting a customer, the ledger of transactions is what makes the balance auditable and explainable later.

## Relevant Stripe Documentation

- Billing overview: https://stripe.com/docs/billing
- Products API: https://stripe.com/docs/api/products
- Prices API: https://stripe.com/docs/api/prices
- Subscriptions API: https://stripe.com/docs/api/subscriptions
- Invoices API and workflow: https://stripe.com/docs/billing/invoices/workflow
- Subscription Schedules: https://stripe.com/docs/billing/subscriptions/subscription-schedules
- Free trials: https://stripe.com/docs/billing/subscriptions/trials
- Coupons: https://stripe.com/docs/billing/subscriptions/coupons
- Customer Portal: https://stripe.com/docs/billing/subscriptions/integrating-customer-portal
- Test Clocks: https://stripe.com/docs/billing/testing/test-clocks
- Core payment flow and webhooks: see `psps/stripe/payments.md`
- Test/live mode practices: see `psps/stripe/testing-and-ops.md`
