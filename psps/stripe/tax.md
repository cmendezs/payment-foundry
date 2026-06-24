# Stripe: Tax

Covers Stripe Tax: jurisdiction registrations, automatic tax calculation on PaymentIntents and Invoices, Customer Tax IDs, reverse-charge and marketplace-facilitator cases, and exports for filing. Relevant for any business selling across jurisdictions where they have, or are about to have, tax-collection obligations.

Tax can be implemented without Billing. The shared catalog primitives it relies on (`Product.tax_code`, `Price.tax_behavior`) live in [`products-and-prices.md`](products-and-prices.md). If Billing is also in scope, see the cross-reference notes in [`billing.md`](billing.md) for tax-on-invoices.

## Verification References

Use these pointers during `/validate-context` and before generating final integration code for this product line. The product-line file below describes stable patterns; supported jurisdictions, tax-code coverage, marketplace-facilitator handling, and filing/export availability change over time and must be re-verified against the sources here.

- **Canonical docs:**
  - https://stripe.com/docs/tax covers the Stripe Tax overview and prerequisites
  - https://stripe.com/docs/tax/registrations covers adding and managing tax registrations per jurisdiction
  - https://stripe.com/docs/tax/zero-tax covers when calculations return zero tax and why (no registration, exempt customer, exempt product)
  - https://stripe.com/docs/tax/calculating covers the Tax Calculation API for one-off calculations outside Invoices/PaymentIntents
  - https://stripe.com/docs/tax/tax-codes covers the Stripe tax-code taxonomy
  - https://stripe.com/docs/tax/tax-ids covers Customer Tax IDs, validation, and reverse-charge implications
  - https://stripe.com/docs/tax/customer-locations covers how customer location is determined (billing address, shipping address, IP)
  - https://stripe.com/docs/tax/reports covers Tax reports and exports used for filing
  - https://stripe.com/docs/tax/connect covers Tax behavior under Connect (platform vs. connected-account responsibility)
- **API Changelog:** https://stripe.com/docs/upgrades, watch for changes to the Tax Calculation API shape, `automatic_tax` parameter behavior on PaymentIntents/Invoices/Subscriptions/Checkout, and reverse-charge response fields.
- **Stripe MCP hints (if connected):**
  - To check the connected account's current tax registrations, list `tax.registrations` on the account.
  - To check whether Stripe Tax is enabled and which jurisdictions are configured, query the Tax settings via the API reference.
  - To check what tax a given line item would produce in a given jurisdiction without creating an Invoice, use the Tax Calculation API (`tax.calculations.create`).
- **What to re-verify before relying on this file:**
  - Current jurisdictions where Stripe Tax can register, calculate, and (where supported) file on the team's behalf.
  - Current tax-code list and any new categories relevant to the team's products.
  - Reverse-charge response fields and the current handling of validated B2B EU Tax IDs.
  - Marketplace-facilitator handling under Connect: in which jurisdictions Stripe Tax treats the platform vs. connected account as the seller of record.
  - Whether filing is available in the team's markets, and which markets require manual filing using exports.

## Prerequisites

Stripe Tax depends on several upstream pieces being correct before any calculation will succeed. Sort these out before integrating, in roughly this order.

### Account-level setup

- **Tax origin address** set on the Stripe account. This is the address Stripe Tax uses as the seller's location for nexus and source-vs.-destination sourcing.
- **Stripe Tax enabled** on the account (Dashboard, Tax > Settings).

### Tax registrations

A registration tells Stripe Tax: "the team is registered to collect tax in jurisdiction X, please calculate and remit on its behalf there." Without a registration for a jurisdiction, Stripe Tax returns zero tax for sales into that jurisdiction (the calculation still runs, but the rate is zero). This is by design, not a bug: collecting tax in a jurisdiction without being registered there is itself a compliance issue.

Add registrations either in the Dashboard or via the API:

```javascript
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const registration = await stripe.tax.registrations.create({
  country: 'DE',
  country_options: {
    de: { type: 'standard' }, // standard German VAT registration
  },
  active_from: 'now',
});
```

[Unverified] The `country_options` shape varies per country (e.g., US states use a different structure under `us`); confirm the current per-country shape at https://stripe.com/docs/tax/registrations before scripting bulk registrations.

Deciding **where** to register is a tax-law question, not a Stripe question. Stripe Tax can monitor thresholds and signal where the team is approaching nexus (via the Dashboard's monitoring views), but the actual decision to register is the team's, in consultation with their tax advisor. This is a review point for `sub-agents/compliance-officer.md` (nexus, registration obligations) and `sub-agents/finance-treasury.md` (cost-of-registration vs. revenue in the jurisdiction).

### Catalog: tax codes and tax behavior

Every Product that will be sold through a Tax-enabled flow needs a `tax_code`. Every Price needs a `tax_behavior` (`inclusive` or `exclusive`); a Price with `tax_behavior: 'unspecified'` blocks Tax calculation on any flow that references it.

These are catalog-design concerns, not Tax-specific concerns. See [`products-and-prices.md`](products-and-prices.md) for the full pattern. Set both at creation time; backfilling is operationally painful.

### Customer location

Stripe Tax determines the customer's location from a combination of:

- `Customer.address` and `Customer.shipping`
- `PaymentMethod` billing address
- IP address (used as a fallback signal, not as the sole source)
- Explicit `customer_details.address` on the calculation/PaymentIntent

The integration's responsibility is to provide a deterministic, defensible location. Relying on IP alone is fragile (VPNs, mobile networks, EU "VAT one-stop shop" cases requiring two pieces of corroborating evidence). Collect the customer's address at checkout and attach it to the `Customer` and to the PaymentIntent/Invoice/Checkout Session.

[Unverified] Specific rules for "two pieces of non-contradictory evidence" in EU OSS contexts have shifted; confirm current requirements at https://stripe.com/docs/tax/customer-locations.

## Integration Patterns

Stripe Tax integrates at several entry points, depending on which flow is in scope. The recommended approach in each case is to set `automatic_tax: { enabled: true }` on the relevant object; Stripe handles the calculation and persists the result.

### Pattern A: PaymentIntents with `automatic_tax`

For one-time payments collected via the Payment Element (see [`payments.md`](payments.md)), Tax sits on the PaymentIntent. However, calculating tax requires line items the PaymentIntent does not natively hold, so the integration typically uses **Checkout Sessions** (see Pattern C) or the **Tax Calculation API** (see Pattern D) and applies the resulting tax to the PaymentIntent amount.

A pure-PaymentIntent flow with `automatic_tax` is supported when the line items are added to the PaymentIntent as part of a wider Invoice or Checkout flow; for a standalone PaymentIntent, Pattern C or D is the practical path.

### Pattern B: Invoices with `automatic_tax` (Billing)

For Billing flows (subscriptions, invoices), set `automatic_tax: { enabled: true }` on the Subscription or Invoice. Stripe Tax computes tax per line item using the customer's location, the Product's `tax_code`, and the Price's `tax_behavior`.

```javascript
const subscription = await stripe.subscriptions.create({
  customer: 'cus_aBcD1234FgHi',
  items: [{ price: 'price_1NXYZpro_plan_monthly_usd' }],
  automatic_tax: { enabled: true },
});
```

```javascript
const invoice = await stripe.invoices.create({
  customer: 'cus_aBcD1234FgHi',
  automatic_tax: { enabled: true },
  collection_method: 'send_invoice',
  days_until_due: 30,
});

await stripe.invoiceItems.create({
  customer: 'cus_aBcD1234FgHi',
  invoice: invoice.id,
  price: 'price_1NXYZprofessional_services',
  quantity: 1,
});

await stripe.invoices.finalizeInvoice(invoice.id);
```

The tax line appears on the finalized invoice automatically. The Customer's address (and optionally Tax IDs, see below) must be set before finalization, otherwise the calculation runs against incomplete location data.

### Pattern C: Checkout Sessions with `automatic_tax` (Payment Links / Checkout)

For Stripe-hosted checkout (Payment Links, see [`payments.md`](payments.md), or Checkout Sessions directly), set `automatic_tax: { enabled: true }` on the session. Tax is calculated based on the address the customer enters at checkout, plus the Product/Price tax configuration.

```javascript
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [
    { price: 'price_1NXYZone_time_item', quantity: 1 },
  ],
  automatic_tax: { enabled: true },
  customer_email: 'customer@example.com',
  success_url: 'https://example.com/success?session={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://example.com/cancel',
});
```

For a Payment Link, the equivalent flag is on `paymentLinks.create`:

```javascript
const link = await stripe.paymentLinks.create({
  line_items: [{ price: 'price_1NXYZone_time_item', quantity: 1 }],
  automatic_tax: { enabled: true },
  after_completion: { type: 'hosted_confirmation' },
});
```

In both cases, Stripe collects the customer's address as part of the hosted page and uses it for the tax calculation.

### Pattern D: Tax Calculation API (standalone)

For custom checkouts where the integration needs to show tax to the customer **before** creating an Invoice or Checkout Session, use the Tax Calculation API directly. This returns a tax calculation object the integration can render in its own UI, then attach to the eventual PaymentIntent / Invoice / Checkout Session.

```javascript
const calculation = await stripe.tax.calculations.create({
  currency: 'usd',
  line_items: [
    {
      amount: 4900, // pre-tax amount in cents
      reference: 'pro_plan_one_time',
      tax_code: 'txcd_10103001',
    },
  ],
  customer_details: {
    address: {
      line1: '1 Main St',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94105',
      country: 'US',
    },
    address_source: 'billing',
  },
});

// calculation.amount_total is the post-tax total to charge.
// calculation.tax_amount_exclusive is the tax to display as a line item.
```

To turn a calculation into a recorded transaction (required for tax reports and filing), call `tax.transactions.createFromCalculation` after the PaymentIntent succeeds:

```javascript
const transaction = await stripe.tax.transactions.createFromCalculation({
  calculation: calculation.id,
  reference: paymentIntent.id,
});
```

This is the only pattern where the integration creates the Tax Transaction explicitly. In Patterns B and C, Stripe creates the transaction as part of Invoice finalization or Checkout completion.

## Customer Tax IDs and Reverse Charge

Business customers in some jurisdictions (most notably the EU) can provide a Tax ID (e.g., EU VAT number) that, when valid, shifts the tax-collection obligation from the seller to the buyer. This is the reverse-charge mechanism.

Attach Tax IDs to the `Customer`:

```javascript
const taxId = await stripe.customers.createTaxId('cus_aBcD1234FgHi', {
  type: 'eu_vat',
  value: 'DE123456789',
});
```

Stripe validates the Tax ID asynchronously (via VIES for EU VAT, equivalent registries for other regions); the result appears on the Tax ID object's `verification.status` (`pending`, `verified`, `unverified`, `unavailable`).

When a valid Tax ID is attached to a Customer and the calculation runs:

- **Cross-border B2B within the EU**: tax is zero-rated under reverse charge. The invoice shows the customer's Tax ID and a "reverse charge" note.
- **Domestic B2B**: standard rate still applies (reverse charge does not apply within the same country).
- **B2B outside the team's registered jurisdictions**: tax is zero (no registration), independent of Tax ID validity.

[Unverified] The exact handling of unverified vs. verified EU VAT numbers (whether Stripe Tax applies the reverse charge based on `verification.status: 'pending'` or only on `verified`) has shifted between releases; confirm at https://stripe.com/docs/tax/tax-ids before going live in EU markets.

Tax ID validation outcomes are a `sub-agents/backend-developer.md` concern (handle pending and unverified states explicitly, do not assume immediate validation) and a `sub-agents/compliance-officer.md` concern (defensibility of reverse-charge application in the team's markets).

## Connect and Marketplace Facilitator Rules

Tax under Connect is one of the more nuanced areas. Two patterns apply:

### Platform handles tax (typical for destination charges)

The platform is the merchant of record. The platform's Stripe Tax registrations apply, and Tax calculation runs on the platform account. Set `automatic_tax: { enabled: true }` on the platform's Checkout Sessions / Invoices / PaymentIntents.

This fits when the platform sells to end customers under its own brand and relationship, with the connected account as a fulfillment partner whose share is a transfer or platform-fee arrangement.

### Connected account handles tax (typical for direct charges)

The connected account is the merchant of record and is responsible for their own tax. Each connected account must enable Stripe Tax and register its own jurisdictions. The platform's role is to scope API calls to the connected account (via `Stripe-Account`) and pass through any platform-fee logic.

### Marketplace facilitator: when the platform is legally the seller

In several US states and an increasing number of other jurisdictions, **marketplace facilitator laws** treat the platform as the seller of record for tax purposes, even when the underlying transaction is between the customer and a connected account. In these cases the platform must collect and remit tax for the entire marketplace, regardless of which connected account fulfilled the sale.

[Unverified] Which jurisdictions Stripe Tax treats under marketplace-facilitator rules, and how it allocates collected tax between platform and connected-account reporting, has evolved. Confirm at https://stripe.com/docs/tax/connect before relying on a specific allocation in a marketplace rollout.

Marketplace-facilitator scope is a foundational decision for any marketplace platform: it affects which entity needs registrations, who files, and how reports break down. Review with `sub-agents/compliance-officer.md` (registration responsibility), `sub-agents/head-of-payments.md` (platform-level governance), and `sub-agents/finance-treasury.md` (filing cadence, cash-flow timing for collected tax).

## Reports, Filing, and Exports

Stripe Tax generates per-jurisdiction reports (transaction-level detail, tax-collected totals, customer location, exemption reasons) usable for filing.

- **Dashboard reports**: per-jurisdiction summary and detail views.
- **API and CSV exports**: programmatic pulls for the team's accounting system, via the Reporting API or the Dashboard.
- **Filing**: in supported markets, Stripe Tax can prepare and file returns directly. [Unverified] Filing coverage is a moving target; confirm available markets and the operational model (Stripe-managed vs. partner-managed) at https://stripe.com/docs/tax/filing before committing the team to a filing approach.

For jurisdictions without Stripe-managed filing, the integration's deliverable to finance is a clean per-jurisdiction export and a documented monthly cadence to pull it.

Reports cadence and revenue-recognition implications are a `sub-agents/finance-treasury.md` review point (see also [`reports.md`](reports.md) for general reporting patterns).

## Common Pitfalls

1. **Enabling `automatic_tax` without active registrations.** Calculation runs and returns zero tax. The team thinks Tax is working; it is silently collecting nothing. Validate after enabling: create a test transaction in a jurisdiction the team is registered in and confirm tax appears on the invoice.

2. **Skipping `tax_code` on Products or leaving `tax_behavior: 'unspecified'` on Prices.** The first defaults to the account-level fallback tax code (which may misclassify); the second blocks calculation outright. Set both at catalog creation time, see [`products-and-prices.md`](products-and-prices.md).

3. **Determining customer location from IP alone.** IP is a fallback signal, not a primary source. EU OSS rules in particular require two pieces of non-contradictory evidence; relying on IP plus billing address (where the billing address is the customer's actual address) is the defensible pattern. Collect address at checkout.

4. **Treating Tax IDs as instantly validated.** Validation is asynchronous. A `Customer.tax_id` with `verification.status: 'pending'` cannot be assumed valid for reverse-charge purposes; handle the validation lifecycle explicitly.

5. **Forgetting to create the Tax Transaction in Pattern D.** A `tax.calculations` result is ephemeral; without calling `tax.transactions.createFromCalculation` after the payment succeeds, the calculation does not show up in tax reports or feed into filing.

6. **Treating Tax under Connect as a platform-only concern.** In direct-charge marketplaces and in jurisdictions outside marketplace-facilitator scope, each connected account is responsible for its own Tax setup. Bake registration and Tax-enablement into connected-account onboarding rather than retrofitting it later.

7. **Assuming Stripe Tax replaces tax advice.** Stripe Tax computes and (where supported) files based on the registrations and configuration the team provides. It does not decide nexus, choose tax codes, or interpret edge cases like exemption certificates or product-classification disputes. Keep `sub-agents/compliance-officer.md` in the loop for those.

## Relevant Stripe Documentation

- Stripe Tax overview: https://stripe.com/docs/tax
- Registrations: https://stripe.com/docs/tax/registrations
- Tax calculation API: https://stripe.com/docs/tax/calculating
- Tax codes: https://stripe.com/docs/tax/tax-codes
- Customer Tax IDs: https://stripe.com/docs/tax/tax-ids
- Customer locations: https://stripe.com/docs/tax/customer-locations
- Tax under Connect (marketplace facilitator): https://stripe.com/docs/tax/connect
- Tax reports and exports: https://stripe.com/docs/tax/reports
- Filing (supported markets): https://stripe.com/docs/tax/filing
- Catalog primitives (`tax_code`, `tax_behavior`): see `psps/stripe/products-and-prices.md`
- Tax on invoices (Billing): see `psps/stripe/billing.md`
- Tax on Payment Links and Checkout Sessions: see `psps/stripe/payments.md` Payment Links subsection
