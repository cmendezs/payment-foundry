# Stripe: Products and Prices

Covers the shared `Product` and `Price` catalog primitives. These objects underpin Billing (subscriptions and invoices), Tax (where the `tax_code` and `tax_behavior` decisions live), and the API path of Payment Links. Load this file the first time any of those product lines is in scope, and reference it from each rather than re-deriving the catalog model.

This file is intentionally narrow: it covers the catalog objects themselves, not how they are consumed. For consumption patterns see [`billing.md`](billing.md), [`tax.md`](tax.md), and the Payment Links subsection of [`payments.md`](payments.md).

## Verification References

Use these pointers during `/validate-context` and before generating final integration code for this product line. The product-line file below describes stable patterns; multi-currency pricing availability, supported `tax_behavior` values, and tax-code coverage must be re-verified against the sources here.

- **Canonical docs:**
  - https://stripe.com/docs/api/products covers the Product object, including `tax_code` and `default_price`
  - https://stripe.com/docs/api/prices covers the Price object, `recurring`, `tax_behavior`, `currency_options`
  - https://stripe.com/docs/products-prices/overview covers when to use Products and Prices vs. ad hoc amounts
  - https://stripe.com/docs/products-prices/pricing-models covers per-unit, tiered, package, and graduated pricing models
  - https://stripe.com/docs/products-prices/manage-prices covers price lifecycle (active/archived, no edits to amount)
  - https://stripe.com/docs/tax/tax-codes covers the Stripe tax-code taxonomy
- **API Changelog:** https://stripe.com/docs/upgrades, watch for changes to `Price.currency_options`, `Price.tax_behavior`, and any successor pricing-model APIs.
- **Stripe MCP hints (if connected):**
  - To check whether multi-currency Prices (`currency_options`) are available on the connected account, create a test Price with `currency_options` and inspect the response.
  - To check the current Stripe tax-code list, query the tax-code reference doc.
  - To check whether a Price with `tax_behavior: 'unspecified'` is allowed when Tax is enabled on the account, query the Tax docs and create a test Invoice referencing the Price.
- **What to re-verify before relying on this file:**
  - Multi-currency Prices availability (`Price.currency_options`) and any beta gating.
  - Current `tax_behavior` accepted values and whether `unspecified` blocks Stripe Tax calculation.
  - The Stripe tax-code list relevant to the team's products and services.
  - Whether `default_price` on Product is enforced or advisory in the current API version.

## Core Objects

### Product

A `Product` represents something the business sells. It is mostly descriptive and carries:

- `name`, `description`, `images`, `metadata`: customer-facing and integration-facing detail.
- `tax_code`: the Stripe tax code that classifies this product for tax calculation (see Tax Codes below). Required for Stripe Tax to compute the correct rate; recommended on every Product even if Tax is not yet in scope, so it does not need to be backfilled later.
- `default_price`: a pointer to the canonical Price for this Product, useful when the integration wants "the price of this Product" without listing all attached Prices.
- `active`: whether the Product can be referenced by new Prices, Invoice Items, Subscriptions, or Payment Links. Archived Products do not break existing references but cannot be used in new ones.

### Price

A `Price` is the central catalog object. It holds the amount, currency, and (for recurring Prices) the billing interval. A single Product can have many Prices: monthly vs. annual, USD vs. EUR, licensed vs. metered.

Key fields:

- `unit_amount` and `currency`: the amount in the smallest currency unit for the price's primary currency.
- `recurring`: present for subscription Prices, absent for one-time Prices. Holds `interval`, `interval_count`, and `usage_type` (`licensed` or `metered`).
- `tax_behavior`: `inclusive`, `exclusive`, or `unspecified`. Tells Tax whether `unit_amount` already includes tax (`inclusive`) or not (`exclusive`). `unspecified` blocks Stripe Tax from computing on this Price; set it before the Price is referenced in a Tax-enabled flow (see [`tax.md`](tax.md)).
- `currency_options`: per-currency overrides for `unit_amount`, `tax_behavior`, and tiers, enabling a single Price to be presented in multiple currencies without managing one Price per currency. [Unverified] Availability and supported currencies have shifted over releases; confirm via the Verification References block before relying on this for a multi-currency rollout.
- `billing_scheme`: `per_unit` (default) or `tiered`. Tiered pricing requires `tiers` and `tiers_mode` (`graduated` or `volume`).
- `transform_quantity`: pre-tier transformation, used for package pricing (e.g., "billed per 1,000 units, rounded up").
- `lookup_key`: an idempotent, human-readable key for retrieving the Price by something other than its `id`. Useful for keeping integration code identical across test and live mode without hardcoding two sets of IDs.

### Immutability

Prices are append-only. The `unit_amount`, `currency`, and `recurring` fields cannot be changed after creation. To change a price, create a new Price and archive the old one (`active: false`). This is by design: it preserves historical accuracy for Subscriptions, Invoices, and Payment Links that reference the older Price.

Editable fields are limited to metadata-shaped ones: `nickname`, `metadata`, `active`, `lookup_key`, and `tax_behavior` (only while it is still `unspecified`).

## Code Examples

### 1. Create a Product with a tax code

```javascript
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const product = await stripe.products.create({
  name: 'Pro Plan',
  description: 'Full access to the Pro feature set.',
  tax_code: 'txcd_10103001', // Software as a service (SaaS), business use
  metadata: { internal_sku: 'plan_pro_v1' },
});
```

Set `tax_code` at Product creation time. Backfilling tax codes later, after Invoices and Subscriptions already reference the Product, is operationally painful and risks miscalculated tax on the migration boundary.

### 2. Create a one-time Price with explicit tax behavior

```javascript
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 4900, // $49.00 in cents
  currency: 'usd',
  tax_behavior: 'exclusive', // unit_amount does not include tax
  lookup_key: 'pro_plan_one_time_usd',
});
```

Set `tax_behavior` at creation. If left `unspecified`, Stripe Tax cannot compute tax for any flow that references this Price until it is updated, and it can only be updated while still `unspecified`.

### 3. Create a recurring Price

```javascript
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 2900, // $29.00 / month in cents
  currency: 'usd',
  recurring: {
    interval: 'month',
    interval_count: 1,
    usage_type: 'licensed',
  },
  tax_behavior: 'exclusive',
  lookup_key: 'pro_plan_monthly_usd',
});
```

This is the Billing entry point: see [`billing.md`](billing.md) for how Subscriptions consume recurring Prices.

### 4. Create a multi-currency Price

```javascript
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 4900,
  currency: 'usd',
  currency_options: {
    eur: { unit_amount: 4500, tax_behavior: 'inclusive' },
    gbp: { unit_amount: 3900, tax_behavior: 'inclusive' },
  },
  tax_behavior: 'exclusive',
  lookup_key: 'pro_plan_one_time_multicurrency',
});
```

A single Price now serves USD, EUR, and GBP customers. The presentment currency is chosen at consumption time (e.g., on the PaymentIntent, Invoice, or Payment Link). `tax_behavior` can differ per currency, reflecting common regional convention (EU prices typically shown tax-inclusive, US prices typically tax-exclusive).

### 5. Tiered (graduated) pricing

```javascript
const price = await stripe.prices.create({
  product: product.id,
  currency: 'usd',
  billing_scheme: 'tiered',
  tiers_mode: 'graduated',
  tiers: [
    { up_to: 1000, unit_amount: 100 },      // first 1,000 units at $1.00 each
    { up_to: 10000, unit_amount: 80 },      // next 9,000 units at $0.80 each
    { up_to: 'inf', unit_amount: 50 },      // everything beyond at $0.50 each
  ],
  recurring: {
    interval: 'month',
    usage_type: 'metered',
  },
  tax_behavior: 'exclusive',
});
```

`graduated` charges each tier at its own rate (the customer pays the blended total). `volume` charges all units at the single rate of the tier the total quantity falls into. Choose deliberately; the difference between the two on a per-customer bill can be large.

### 6. Retrieve by `lookup_key` instead of `id`

```javascript
const prices = await stripe.prices.list({
  lookup_keys: ['pro_plan_monthly_usd'],
  expand: ['data.product'],
});
const price = prices.data[0];
```

This is the recommended pattern for integration code that should run identically against test and live mode. Set the `lookup_key` to a stable, semantic name (`pro_plan_monthly_usd`) rather than hardcoding the `id` (`price_1NXYZ...`), which differs between modes.

## Tax Codes

Stripe Tax uses a taxonomy of `tax_code` values that classify what a Product actually is for tax purposes: SaaS, downloadable software, physical goods, professional services, digital media, and so on. The tax code drives:

- The rate applied per jurisdiction, since jurisdictions tax different product types at different rates (e.g., physical books are zero-rated in some EU countries, SaaS is treated differently from on-premise software in many US states).
- Whether the product is taxable at all in a given jurisdiction.

Set `tax_code` on the Product, not the Price. All Prices attached to a Product inherit its tax code for calculation purposes.

If `tax_code` is unset, Stripe Tax falls back to the account-level default tax code. This is a workable default for businesses with a single product type, but mis-classifies as soon as the catalog grows. Set `tax_code` per Product from the start.

See [`tax.md`](tax.md) for how tax codes interact with calculation, and the canonical tax-code list at https://stripe.com/docs/tax/tax-codes.

## Catalog Design Decisions

A few decisions at catalog-design time tend to surface again later. Surface them early with `sub-agents/backend-developer.md` and `sub-agents/finance-treasury.md`.

### One Product per offering vs. one Product per variant

Recommended pattern: one Product per offering ("Pro Plan", "Enterprise Plan"), multiple Prices per Product for variations (monthly/annual, USD/EUR). Reserve a second Product only when the offerings genuinely differ in tax treatment, accounting category, or customer-facing identity.

### `lookup_key` naming convention

Pick a convention before creating live Prices. A common one: `<product-slug>_<billing-shape>_<currency>` (e.g., `pro_plan_monthly_usd`, `pro_plan_annual_eur`). Lookup keys are unique within active Prices in the account, so a clear convention prevents collisions and makes integration code self-documenting.

### Multi-currency: `currency_options` vs. one Price per currency

`currency_options` keeps the catalog smaller and lets a single Price cover several currencies, which simplifies referencing in Subscriptions, Invoices, and Payment Links. One Price per currency is the older pattern and may still be needed for currencies not yet supported under `currency_options`, or where per-currency lifecycle (archive one currency, keep others) is required. Default to `currency_options`, fall back to per-currency Prices only where it is required.

### `tax_behavior`: inclusive or exclusive

The choice affects what the customer sees at checkout and what reconciles back to the GL. Aligning per-region (`exclusive` in the US, `inclusive` in the EU and UK) via `currency_options.tax_behavior` is a common pattern. Setting it once at Price creation avoids the "stuck `unspecified`" trap that blocks Tax calculation later.

## Common Pitfalls

1. **Leaving `tax_behavior` as `unspecified` on Prices that will be used with Stripe Tax.** Tax calculation fails for the consuming Invoice or PaymentIntent until the Price is updated, and the update is only possible while `tax_behavior` is still `unspecified`. Set it at creation.

2. **Skipping `tax_code` on Products at creation time.** Backfilling later means revisiting every Product in the catalog, often under time pressure when Tax is being rolled out. Set it from the start, even before Stripe Tax is enabled.

3. **Hardcoding Price IDs instead of `lookup_key`.** Test-mode and live-mode Price IDs differ, leading to environment-specific branches in integration code. `lookup_key` lookups are identical across modes.

4. **Trying to edit `unit_amount` on an existing Price.** Prices are append-only on amount and currency. Create a new Price, archive the old one, and migrate references (existing Subscriptions can be moved to the new Price via subscription updates; new Subscriptions reference the new Price directly).

5. **Confusing `graduated` and `volume` tiered pricing.** They produce different bills for the same usage. Validate the expected bill against a worked example before rolling out tiered pricing.

6. **Archiving a Product without checking active Subscriptions/Payment Links.** Archived Products cannot be referenced in new flows, but existing flows continue to charge against them. Confirm what will be affected before archiving.

## Relevant Stripe Documentation

- Products API: https://stripe.com/docs/api/products
- Prices API: https://stripe.com/docs/api/prices
- Products and Prices overview: https://stripe.com/docs/products-prices/overview
- Pricing models (per-unit, tiered, package): https://stripe.com/docs/products-prices/pricing-models
- Managing Prices (lifecycle): https://stripe.com/docs/products-prices/manage-prices
- Stripe Tax codes: https://stripe.com/docs/tax/tax-codes
- Consumed by Billing: see [`billing.md`](billing.md)
- Consumed by Tax: see [`tax.md`](tax.md)
- Consumed by Payment Links (API path): see [`payments.md`](payments.md) Payment Links subsection
