# Stripe: Capital

Covers Stripe Capital: financing (term loans, advances) offered by a platform to its connected accounts (sellers, merchants, freelancers) through Stripe. Relevant for platforms on Connect that want to offer their connected accounts working-capital financing without standing up an in-house lending operation.

This file assumes Connect is in scope and that the base flow in [`platform.md`](platform.md) is understood. Capital is tightly coupled to Connect: offers are made to connected accounts, and repayments flow through the connected account's Stripe balance (and ultimately through the platform's transfer/application-fee mechanics).

## Verification References

Use these pointers during `/validate-context` and before generating final integration code for this product line. The product-line file below describes stable patterns; eligibility surfaces, offer presentation requirements, repayment mechanics, and per-country availability change over time and must be re-verified against the sources here.

- **Canonical docs:**
  - https://stripe.com/docs/capital covers Stripe Capital overview and the platform model
  - https://stripe.com/docs/capital/for-platforms covers the platform-facing integration (eligibility surface, offer display, application redirect, repayment)
  - https://stripe.com/docs/capital/webhooks covers Capital webhook event types
  - https://stripe.com/docs/connect covers the underlying Connect model (see also `psps/stripe/platform.md`)
- **API Changelog:** https://stripe.com/docs/upgrades, watch for changes to Capital eligibility/offer API endpoints, webhook event names, and disclosure requirements.
- **Stripe MCP hints (if connected):**
  - To check whether a given connected account has an active Capital offer, retrieve `capital.financing_offers` filtered by `account` for that connected account.
  - To check whether a connected account has an active financing (post-acceptance), retrieve `capital.financing_summary` for that account.
  - To check current per-country availability of Stripe Capital, query the canonical docs.
- **What to re-verify before relying on this file:**
  - Per-country availability of Stripe Capital and the supported connected-account types (Standard, Express, Custom).
  - Current API endpoints and naming for financing offers, summaries, and transactions (these have shifted between releases).
  - Required offer-disclosure fields and their presentation rules (regulatory disclosures vary by jurisdiction).
  - Repayment mechanics: how Stripe deducts repayment from connected-account balances, and how this interacts with the platform's `application_fee` and `transfer_data` configuration.
  - Whether the team's contract with Stripe enables Capital for their platform; Capital is platform-by-platform enabled, not on by default.

## Platform Model

Stripe Capital, in the platform model covered here, works as follows:

1. **Stripe is the lender**, not the platform. The platform surfaces offers to its connected accounts and routes them into Stripe's flow, but does not underwrite, fund, or hold the loan.
2. **Eligibility is determined by Stripe** based on the connected account's processing history, balance history, and other signals available through Connect.
3. **The platform's role** is to display eligibility and offer details on its own surface (e.g., the seller dashboard), redirect the connected account to Stripe's hosted application flow at the moment of interest, and surface repayment status.
4. **Repayment is automatic**: Stripe deducts a percentage of the connected account's daily processing volume until the financing plus fee is repaid. The platform does not handle repayment cash flows directly.
5. **No platform credit exposure**: because Stripe is the lender, the platform does not take credit risk on the loans it surfaces.

This is the only model covered in this file. There is also a Capital path where the connected account interacts with Stripe directly (without a platform), but the platform-integrator path is what Connect platforms actually integrate against.

## Prerequisites

Before any Capital integration work, confirm:

- **Capital enabled on the platform's Stripe contract.** Capital is not on by default; the team's Stripe account team must enable it for the platform, and it is currently available only in specific countries. Verify both.
- **Connect is already in place** (see [`platform.md`](platform.md)). Capital cannot exist without Connect.
- **Sufficient processing history through the platform.** Stripe needs enough transactional history on connected accounts to underwrite. Newly onboarded platforms or platforms with very low per-account volume may not see any eligible accounts initially.
- **Regulatory and legal review on the platform side.** Surfacing financing offers is a regulated activity in many jurisdictions, even when Stripe is the lender. This is a `sub-agents/compliance-officer.md` review point before going to market.

## Integration Patterns

### Eligibility surface (platform-facing)

The platform queries Stripe to find out which of its connected accounts have an active offer. Surface eligibility on the seller's dashboard or wherever the offer is most relevant.

```javascript
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Retrieve current financing offers for a specific connected account
const offers = await stripe.capital.financingOffers.list({
  connected_account: connectedAccountId,
  status: 'delivered', // 'delivered' = active and presentable; other statuses include 'accepted', 'expired', 'paid_off'
  limit: 10,
});

if (offers.data.length > 0) {
  const offer = offers.data[0];
  // Render eligibility and offer details on the platform's surface, see Disclosures below.
}
```

[Unverified] Endpoint naming and field shape on `capital.financingOffers` have shifted between releases; confirm at https://stripe.com/docs/capital/for-platforms before scripting against the API.

### Offer details and disclosures

Each offer carries the financing amount, the fixed fee, the total repayment amount, the repayment percentage (of daily processing volume), and expiry. **All of these must be presented to the connected account before they accept**, in the form Stripe specifies. Stripe provides the canonical disclosure text per jurisdiction; the platform's role is to render it accurately, not to paraphrase or restructure it.

Misrendering disclosures (omitting required fields, restructuring the layout in ways that downplay fees, mixing platform marketing copy into the offer block) creates regulatory exposure for the platform even though Stripe is the lender. This is a `sub-agents/compliance-officer.md` and `sub-agents/frontend-developer.md` review point: the offer-presentation surface must match Stripe's specification.

### Application redirect

The connected account does not apply through the platform's UI. Instead, the platform generates a session/link that hands the connected account off to Stripe's hosted application flow, where they review terms, accept (or decline), and complete any final verification.

```javascript
// Generate a session for the connected account to review and accept the offer.
// The connected account is redirected to session.url to complete the flow.
const session = await stripe.capital.financingOffers.markDelivered(offerId);
// After this, the connected account can be redirected to Stripe's hosted experience
// using the URL/session pattern documented in Capital for Platforms.
```

[Unverified] The exact method/parameter names for generating the application redirect have changed across releases (the Capital API has evolved from a Dashboard-only flow to an API-driven offer surface and back in places). Confirm the current method for handing off to the hosted application flow at https://stripe.com/docs/capital/for-platforms before integration.

### Acceptance and funding

When the connected account accepts an offer:

1. Stripe disburses the financing amount to the connected account's Stripe balance.
2. A `capital.financing_offer.accepted` webhook fires on the platform.
3. The financing becomes active and repayment begins on subsequent processing volume.

The platform does not move funds for disbursement; Stripe handles it.

### Repayment

Repayment is automated: Stripe deducts a configured percentage of each day's processing volume on the connected account until the total repayment amount is reached. The platform does not initiate repayments and does not see repayment as a separate cash movement; it appears as a reduction in the connected account's available balance and is visible in the financing summary.

```javascript
const summary = await stripe.capital.financingSummary.retrieve(
  { stripeAccount: connectedAccountId },
);
// summary.details holds advance_paid_out_at, remaining_amount, fee_amount, etc.
// Use this to surface "X paid back of Y" on the connected account's dashboard.
```

Repayment interaction with the platform's existing `application_fee_amount` configuration is a design point worth thinking through:

- The connected account's daily processing still funds platform fees as before. Capital repayment runs alongside, drawing from the connected account's share rather than the platform's fee.
- High repayment percentages combined with high platform fees can leave the connected account with very little daily liquidity. Model the combined effective deduction for typical-volume connected accounts before going live.
- For Connect Standard accounts (where the connected account holds its own balance more independently), the visible effect on payouts may be larger than for Express/Custom; confirm what the seller will actually see.

This is a `sub-agents/finance-treasury.md` (connected-account cash flow) and `sub-agents/head-of-payments.md` (seller-experience implications, churn risk if cash flow becomes punitive) review point.

### Webhook handling

The platform receives Capital lifecycle webhooks on its own webhook endpoint. The events worth handling explicitly:

```javascript
switch (event.type) {
  case 'capital.financing_offer.created':
    // A new offer is now available for the connected account.
    // Update the platform's internal record so the eligibility surface refreshes.
    break;

  case 'capital.financing_offer.accepted':
    // The connected account accepted the offer. Disbursement is happening.
    // Update the platform's internal record; consider notifying the connected account
    // (in addition to Stripe's own confirmation) via the platform's normal channels.
    break;

  case 'capital.financing_offer.expired':
  case 'capital.financing_offer.canceled':
    // Offer is no longer available. Remove eligibility surface for this account.
    break;

  case 'capital.financing_transaction.created':
    // A repayment was deducted from the connected account's balance.
    // Optionally reflect this on the platform's seller-facing financing summary view.
    break;

  default:
    break;
}
```

[Unverified] Capital webhook event names have changed between releases; confirm current event names at https://stripe.com/docs/capital/webhooks before wiring handlers.

Webhook routing under Connect: some Capital events arrive on the platform account, others on the connected account, depending on the integration mode. Confirm routing during scoping with `sub-agents/backend-developer.md`.

## Common Pitfalls

1. **Treating Capital eligibility as platform-controlled.** The platform cannot make a connected account eligible by surfacing more flattering numbers; eligibility is Stripe's decision based on processing and balance signals. Set seller expectations accordingly.

2. **Restructuring disclosures.** Offer text, fees, and repayment terms must be presented as Stripe specifies. Marketing copy belongs around the offer, not inside it. This is the single highest regulatory-exposure surface in a Capital integration.

3. **Underestimating combined cash-flow impact.** A 20% platform fee plus a 15% repayment percentage means 35% of daily processing volume is deducted before the seller sees anything. Model the combined effective rate for realistic seller cohorts during scoping.

4. **Assuming Capital is available everywhere Connect is.** Capital is country-by-country and platform-by-platform enabled. Confirm both before promising it to sellers.

5. **Forgetting to handle offer expiry.** Offers do expire. If the platform's UI continues to show an expired offer after the `capital.financing_offer.expired` webhook, the seller experience deteriorates (clicking "Accept" returns an error from Stripe). Drive UI state from the latest webhook, not from a snapshot pulled at page load and cached.

6. **Surfacing offers without notifying the team's compliance/legal function.** Offering financing, even as a platform passing through a third-party lender, has regulatory implications in most jurisdictions. Loop in `sub-agents/compliance-officer.md` before any seller sees an offer in production.

7. **Trying to handle repayment manually.** Repayment is automated by Stripe from the connected account's balance. The platform should not attempt to model repayment as a separate transfer or `application_fee` line; doing so double-counts.

## Relevant Stripe Documentation

- Stripe Capital overview: https://stripe.com/docs/capital
- Capital for Platforms: https://stripe.com/docs/capital/for-platforms
- Capital webhooks: https://stripe.com/docs/capital/webhooks
- Underlying Connect model: see `psps/stripe/platform.md`
- Reconciliation and reporting (general): see `psps/stripe/reports.md`
