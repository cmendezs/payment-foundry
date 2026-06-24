# Stripe: Treasury

Covers Stripe Treasury: embedded banking offered by a platform to its connected accounts. Financial accounts (FBO-style, in Stripe's banking-as-a-service model), inbound money movement (ACH credits, wires, internal transfers), outbound money movement (OutboundTransfers and OutboundPayments via ACH and wire), and the supporting reconciliation events.

This file covers the **platform-integrator path only**: a Connect platform standing up Treasury for its connected accounts. Treasury does not exist outside the platform model.

Treasury is typically the most regulated and most operationally heavy product line in Stripe's catalog. Scope realistically with `sub-agents/head-of-payments.md`, `sub-agents/compliance-officer.md`, and `sub-agents/finance-treasury.md` before committing to a timeline.

## Verification References

Use these pointers during `/validate-context` and before generating final integration code for this product line. The product-line file below describes stable patterns; per-country availability, supported network rails (ACH, wire, SEPA, FPS), per-transaction limits, and financial-account opening requirements change over time and must be re-verified against the sources here.

- **Canonical docs:**
  - https://stripe.com/docs/treasury covers Treasury overview, the platform model, and account eligibility
  - https://stripe.com/docs/treasury/account-management/financial-accounts covers financial-account creation, features, and aliases (routing/account numbers)
  - https://stripe.com/docs/treasury/moving-money/financial-accounts/in covers inbound flows (received credits, ACH, wires)
  - https://stripe.com/docs/treasury/moving-money/financial-accounts/out covers outbound flows (OutboundTransfers, OutboundPayments, supported rails)
  - https://stripe.com/docs/treasury/webhooks covers Treasury webhook event types and routing
  - https://stripe.com/docs/treasury/connect covers the Treasury + Connect interaction model
  - https://stripe.com/docs/issuing/funding/treasury covers using Treasury as the funding source for Issuing cards (the common pairing)
- **API Changelog:** https://stripe.com/docs/upgrades, watch for changes to FinancialAccount feature naming, OutboundPayment vs. OutboundTransfer semantics, and ReceivedCredit/ReceivedDebit event shape.
- **Stripe MCP hints (if connected):**
  - To check whether the platform is enabled for Treasury and in which countries, query the account capabilities via the API reference.
  - To check current rails and per-transaction limits on a financial account, retrieve the FinancialAccount object and inspect `features` and the connected account's Treasury capabilities.
  - To check the status of an OutboundPayment or ReceivedCredit, retrieve the object directly via the Treasury API.
- **What to re-verify before relying on this file:**
  - Per-country availability of Treasury (the team's connected accounts can only hold financial accounts where Treasury is supported).
  - Currently supported inbound and outbound rails (ACH, wire, SEPA, FPS) per country, and any beta gating on outbound rails.
  - Per-transaction and per-day limits for OutboundPayments and OutboundTransfers; these are connected-account-specific.
  - Whether the team's platform contract enables Treasury; Treasury is opt-in at the platform contract level, not on by default.
  - Required compliance disclosures and program-agreement language for financial-account opening on the platform's surface.

## Platform Model

Stripe Treasury operates under a sponsor-bank model:

1. **A sponsor bank holds the funds.** Stripe operates the technology layer; partner banks hold the deposits. The platform does not become a bank.
2. **Connected accounts hold financial accounts.** Each connected account that the platform enables for Treasury can have one (or, where supported, more) financial account. The financial account has its own ACH routing/account number aliases for receiving funds.
3. **The platform integrates and presents.** The platform surfaces account balances, transactions, money-movement initiation, and statements to the connected account. The platform does not hold the funds and does not take direct credit risk for them, but takes on substantial responsibility for the user experience, KYC, and ongoing compliance.
4. **Capabilities are explicitly granted.** Beyond Connect's base capabilities, each connected account must have Treasury capabilities (`treasury` and the relevant feature capabilities like `treasury.financial_addresses.aba.requested`) granted, and the platform must have requested them.

## Prerequisites

Before integration work:

- **Treasury enabled on the platform's Stripe contract.** Treasury requires a specific contract amendment with Stripe; it is not available by default. Confirm with the Stripe account team.
- **Connect is already in place** (see [`platform.md`](platform.md)). Treasury cannot exist without Connect.
- **Compliance and legal review on the platform side.** Offering banking-like products has substantial regulatory implications (program agreements, customer disclosures, BSA/AML, complaints handling, Reg E in the US, equivalents elsewhere). This is a `sub-agents/compliance-officer.md` foundational review, not a checkbox.
- **Operational model decided.** Who in the team handles dispute/error resolution, regulatory complaint handling, account-closure workflows, suspicious-activity escalation. Treasury introduces operational obligations that do not exist for processing-only Stripe accounts.
- **Connected-account type confirmed.** Treasury financial accounts are typically held by Express or Custom connected accounts under the platform. Confirm with `sub-agents/solution-architect.md` and `sub-agents/compliance-officer.md` which account type matches the team's responsibility model.

## Integration Patterns

### Creating a financial account

A financial account is created on a connected account by the platform.

```javascript
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const financialAccount = await stripe.treasury.financialAccounts.create(
  {
    supported_currencies: ['usd'],
    features: {
      financial_addresses: { aba: { requested: true } }, // request a US ACH routing/account number
      inbound_transfers: { ach: { requested: true } },
      outbound_payments: { ach: { requested: true }, us_domestic_wire: { requested: true } },
      outbound_transfers: { ach: { requested: true }, us_domestic_wire: { requested: true } },
      received_credits: { credit_reversals: { requested: true } },
      received_debits: { debit_reversals: { requested: true } },
    },
  },
  { stripeAccount: connectedAccountId },
);
```

The `features` block requests specific capabilities; each follows a request/grant lifecycle where Stripe either grants it (immediately or after review) or returns `restricted`/`pending`. Inspect `financialAccount.features` after creation to know what is actually available; do not assume requested means granted.

`financialAccount.financial_addresses` holds the routing/account number aliases once the `aba` feature is granted. These are the numbers the connected account uses to receive ACH/wire credits.

[Unverified] Feature naming and the request/grant flow have evolved between releases; confirm at https://stripe.com/docs/treasury/account-management/financial-accounts before scripting bulk financial-account creation.

### Inbound money movement

Inbound transfers come in two main shapes:

**ReceivedCredit**: an external party sends money to the financial account's ACH routing/account number or wire instructions. The arrival fires a `treasury.received_credit.created` event. There is no API call to initiate this from Stripe's side; the integration only observes.

```javascript
case 'treasury.received_credit.created': {
  const credit = event.data.object;
  // credit.financial_account, credit.amount, credit.currency, credit.network ('ach' | 'us_domestic_wire' | ...)
  // credit.linked_flows may tie back to an OutboundPayment reversal or an Issuing authorization, depending on the source.
  // Update the connected account's internal ledger; surface in the platform's UI.
  break;
}
```

**InboundTransfer**: the platform (or connected account) pulls funds from a linked external bank account into the financial account via ACH debit. This is an explicit API call.

```javascript
const inbound = await stripe.treasury.inboundTransfers.create(
  {
    amount: 500000, // $5,000.00
    currency: 'usd',
    financial_account: financialAccountId,
    origin_payment_method: paymentMethodId, // a verified external bank account
    description: 'Initial deposit',
  },
  { stripeAccount: connectedAccountId },
);
```

InboundTransfers have a settlement window similar to ACH (typically 1-3 business days) during which the funds may be returned. The `treasury.inbound_transfer.succeeded` and `treasury.inbound_transfer.failed` events drive the final outcome.

### Outbound money movement

Two distinct outbound APIs exist, with different semantics:

**OutboundPayment**: sends money to an **external** counterparty (a bank account held outside Stripe, or another financial account at a different institution). Used for payouts, vendor payments, and any case where the recipient is identified by external bank details.

```javascript
const payment = await stripe.treasury.outboundPayments.create(
  {
    amount: 250000, // $2,500.00
    currency: 'usd',
    financial_account: financialAccountId,
    destination_payment_method: externalPaymentMethodId,
    statement_descriptor: 'PAYOUT-2024-Q1',
  },
  {
    stripeAccount: connectedAccountId,
    idempotencyKey: `outbound_payment_${internalRef}`,
  },
);
```

**OutboundTransfer**: moves money from a financial account to a **linked external bank account owned by the same connected account** (e.g., a sweep from the financial account to the connected account's everyday business bank account). Semantics differ from OutboundPayment in that the destination is owned by the same legal entity.

```javascript
const transfer = await stripe.treasury.outboundTransfers.create(
  {
    amount: 1000000, // $10,000.00
    currency: 'usd',
    financial_account: financialAccountId,
    destination_payment_method: connectedAccountsOwnBankAccountId,
  },
  {
    stripeAccount: connectedAccountId,
    idempotencyKey: `outbound_transfer_${sweepDate}`,
  },
);
```

Both go through statuses (`processing`, `posted`, `returned`, `canceled`, `failed`) and fire webhooks at each transition. Always use idempotency keys: a network retry on an outbound money-movement call without an idempotency key can send money twice.

### Linked external accounts

Outbound destinations and InboundTransfer origins must be verified external bank accounts attached as PaymentMethods to the relevant Customer (or connected account). Verification typically uses micro-deposits or instant verification via a partner (Plaid-style). The verification flow is a `sub-agents/frontend-developer.md` (collection UX) and `sub-agents/security-officer.md` (account-ownership verification) review point.

### Treasury as Issuing funding source

A common pairing: the connected account's Issuing balance is funded directly from its Treasury financial account. This is the cleanest funding model for platforms running both products, because it removes the need for separate top-ups and lets Issuing authorizations draw against the same balance the connected account uses for everything else.

```javascript
const card = await stripe.issuing.cards.create(
  {
    cardholder: cardholderId,
    currency: 'usd',
    type: 'virtual',
    financial_account: financialAccountId, // ties this card's authorizations to the financial account
  },
  { stripeAccount: connectedAccountId },
);
```

This is the standard pattern for "embedded finance" platforms where the seller's financial account is the unified spend+receive surface. See [`issuing.md`](issuing.md) for the Issuing side of this pairing.

### Webhook handling

Treasury fires events for every step of every flow. The high-frequency ones to handle explicitly:

```javascript
switch (event.type) {
  case 'treasury.received_credit.created':
    // External credit arrived; update connected account's ledger
    break;
  case 'treasury.received_debit.created':
    // External debit hit the account (e.g., authorized ACH pull); update ledger
    break;
  case 'treasury.inbound_transfer.succeeded':
  case 'treasury.inbound_transfer.failed':
    // ACH pull from linked external account completed or failed
    break;
  case 'treasury.outbound_payment.posted':
  case 'treasury.outbound_payment.returned':
  case 'treasury.outbound_payment.failed':
    // External payout finalized one way or the other
    break;
  case 'treasury.outbound_transfer.posted':
  case 'treasury.outbound_transfer.returned':
  case 'treasury.outbound_transfer.failed':
    // Sweep to connected account's own bank account finalized
    break;
  case 'treasury.financial_account.features_status_updated':
    // A requested feature transitioned to granted/restricted; refresh capability cache
    break;
  default:
    break;
}
```

Some Treasury events arrive on the connected account, others on the platform account; confirm routing at https://stripe.com/docs/treasury/webhooks during scoping.

## Stablecoin financial accounts

For US businesses, a Treasury financial account can hold stablecoin balances alongside fiat. This is the integration surface for "embedded crypto" use cases (cross-border payouts to contractors, in-product savings/spend in dollar-backed tokens, marketplace payouts in stablecoins).

Treasury-side capabilities (each subject to the standard request/grant lifecycle on FinancialAccount features, plus Stripe stablecoin enablement on the account):

- **Hold a stablecoin balance** on the financial account, denominated in supported tokens (USDC and others, per Stripe agreement and per region).
- **Convert between fiat and stablecoin on-account**, with Stripe handling the on-chain leg.
- **Outbound on-chain payouts**: send stablecoins from the financial account to external crypto wallets (OutboundPayment-equivalent flow). Subject to sanctions screening on the destination wallet, Travel Rule data exchange where applicable, and the unrecoverable-typo failure mode (see Common Pitfalls in [`stablecoins.md`](stablecoins.md)).
- **Inbound on-chain credits**: receive stablecoins into the financial account from external wallets, surfaced via ReceivedCredit-equivalent events.
- **Card spend from a stablecoin balance**: an Issuing card whose primary funding source is the stablecoin balance, with authorization-time conversion to fiat at the network. See [`issuing.md`](issuing.md) Spending stablecoin balances.

The dual-currency ledger model on the integration side is the central design point. Single-balance ledgers become misleading once a meaningful stablecoin balance exists; design for both currencies and the conversions between them from the start, with audit-trail granularity per conversion event. This is a `sub-agents/finance-treasury.md`, `sub-agents/backend-developer.md`, `sub-agents/compliance-officer.md`, and `sub-agents/head-of-payments.md` scoping conversation.

Outbound on-chain transfers introduce failure modes that ACH does not: address typos sending funds to unrecoverable destinations, network congestion delaying settlement, sanctions-list updates retroactively flagging counterparties. Model these explicitly during scoping; the operational UX patterns to mitigate (address allowlisting, small-amount test transfer, recipient confirmation step) belong in the design from the start.

The cross-cutting model (regulatory framing, supported assets per surface, settle-in-stablecoin vs. settle-in-fiat, Issuing pairing, Open Issuance) is in [`stablecoins.md`](stablecoins.md). Load it when stablecoin Treasury balances are in scope.

## Reconciliation and Ledgering

Treasury produces a real-time stream of balance-affecting events on each financial account. The integration is expected to maintain its own ledger that:

- Mirrors every ReceivedCredit, ReceivedDebit, InboundTransfer, OutboundPayment, OutboundTransfer, and any associated reversal.
- Reconciles daily against Stripe's balance reports (see [`reports.md`](reports.md)) so any drift is caught within one day, not at month end.
- Records the network (`ach`, `us_domestic_wire`, `sepa_credit_transfer`, ...) and any returned/reversed status, since these drive the final outcome.

ACH returns can land days after the original credit. Posting a balance update to the connected account's UI on `received_credit.created` without modeling a "pending vs. final" state is a frequent source of operational pain: the connected account sees a balance, spends against it, and then watches it disappear when the return arrives.

`sub-agents/finance-treasury.md` and `sub-agents/backend-developer.md` jointly own the ledger design. This is a foundational decision; revisiting it under load is painful.

## Disclosures and Customer-Facing Surfaces

Financial-account opening, statements, fee disclosures, error-resolution notices, and program-agreement acceptance all have prescribed content (varying by jurisdiction and by sponsor-bank requirements). The platform's surface must present them as specified. As with Capital, the platform does not author this text; it renders Stripe's canonical text accurately.

Misrendering disclosures on a banking surface carries materially higher regulatory exposure than on a payments-only surface. Review the surface designs with `sub-agents/compliance-officer.md` and `sub-agents/frontend-developer.md` before any connected account sees them in production.

## Common Pitfalls

1. **Treating Treasury as "another Stripe product."** Treasury introduces banking-grade operational and regulatory obligations: dispute and error-resolution timelines (Reg E in the US, equivalents elsewhere), suspicious-activity escalation, account-closure procedures, complaints handling. Scope these alongside the integration work, not after.

2. **Skipping the pending-vs.-final balance distinction.** ReceivedCredits and InboundTransfers can be returned days after they appear. Surfacing a single "balance" number without distinguishing settled and pending leads to overdrafts when returns hit.

3. **Forgetting idempotency on outbound money movement.** A network retry without an idempotency key on an OutboundPayment or OutboundTransfer can send money twice. Use deterministic idempotency keys derived from the internal reference, not from timestamps.

4. **Confusing OutboundPayment and OutboundTransfer.** OutboundPayment goes to external counterparties; OutboundTransfer goes to the connected account's own linked bank account. Mixing them produces wrong reporting (the two reconcile differently for the connected account) and can produce wrong tax/legal characterization downstream.

5. **Assuming requested features are granted features.** The `features` block on FinancialAccount creation is a request. Always read back `financialAccount.features` and gate flows on granted status, not on what was requested.

6. **Surfacing ACH routing/account aliases before the `aba` feature is granted.** The aliases do not exist until the feature is granted; the platform's UI must handle the "requested, not yet granted" state explicitly.

7. **Not modeling sponsor-bank constraints.** Per-transaction limits, daily caps, and rail availability are tied to the underlying sponsor bank and per-connected-account underwriting. They can change. Surface them dynamically from the financial-account capabilities rather than hardcoding limits in the UI.

8. **Treating Treasury as a profit center on day one.** Treasury monetization (interchange share on Issuing-paired flows, interest, optional fees) develops over time as connected accounts adopt and as usage stabilizes. The initial integration cost and ongoing operational cost are substantial; model the financial case realistically with `sub-agents/finance-treasury.md` and `sub-agents/head-of-payments.md`.

## Relevant Stripe Documentation

- Stripe Treasury overview: https://stripe.com/docs/treasury
- Financial accounts: https://stripe.com/docs/treasury/account-management/financial-accounts
- Moving money in (ReceivedCredits, InboundTransfers): https://stripe.com/docs/treasury/moving-money/financial-accounts/in
- Moving money out (OutboundPayments, OutboundTransfers): https://stripe.com/docs/treasury/moving-money/financial-accounts/out
- Treasury webhooks: https://stripe.com/docs/treasury/webhooks
- Treasury under Connect: https://stripe.com/docs/treasury/connect
- Issuing funded from Treasury (the common pairing): https://stripe.com/docs/issuing/funding/treasury
- Underlying Connect model: see `psps/stripe/platform.md`
- Issuing (when Treasury funds cards): see `psps/stripe/issuing.md`
- Stablecoin financial accounts (cross-cutting model): see `psps/stripe/stablecoins.md`
- Reconciliation and reporting: see `psps/stripe/reports.md`
