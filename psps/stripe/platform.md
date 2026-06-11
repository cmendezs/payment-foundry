# Stripe: Platform (Connect)

Covers Stripe Connect account types, transfers, payouts, and platform fees. Relevant for marketplaces, platforms, or any business that needs to move money to a third party (sellers, freelancers, drivers, merchants) rather than just keeping it.

This file assumes the base flow in [`payments.md`](payments.md) is understood, Connect builds on PaymentIntents.

## Verification References

Use these pointers during `/validate-context` and before generating final integration code for this product line. The product-line file below describes stable patterns; account types, supported countries, fee structures, and capability requirements must be re-verified against the sources here.

- **Canonical docs:**
  - https://stripe.com/docs/connect covers the Connect overview and decision flow
  - https://stripe.com/docs/connect/accounts covers current account types and naming (Standard, Express, Custom, embedded components)
  - https://stripe.com/docs/connect/express-accounts covers Express onboarding specifics
  - https://stripe.com/docs/connect/charges-transfers covers direct, destination, and separate-charges-and-transfers patterns
  - https://stripe.com/docs/connect/webhooks covers Connect event routing between platform and connected accounts
  - https://stripe.com/docs/connect/account-links covers AccountLink lifetimes and refresh flow
  - https://stripe.com/docs/connect/account-balances covers `debit_negative_balances` country support and behavior
  - https://stripe.com/docs/payouts#supported-accounts-and-settlement-currencies covers per-country payout support and multi-currency bank accounts
  - https://stripe.com/docs/connect/account-debits covers pulling funds back from a connected account
- **API Changelog:** https://stripe.com/docs/upgrades, watch for changes to Connect account types, capability names, and Connect webhook routing.
- **Stripe MCP hints (if connected):**
  - To check whether a connected account can accept payments and receive payouts, inspect `charges_enabled` and `payouts_enabled` on the Account object.
  - To check supported capabilities for a given country, retrieve the country specs via the API reference.
  - To check supported settlement currencies for an account's country, query the relevant doc page or the account's external accounts.
- **What to re-verify before relying on this file:**
  - Current account type names and capabilities, and whether "embedded components" or other newer offerings change the recommendation.
  - Countries that support multiple bank accounts and additional settlement currencies on a single account.
  - Countries where `debit_negative_balances` is available and the current behavior on failed external-account debits.
  - Current Connect webhook routing (which events arrive on the platform account vs. the connected account).
  - Per-country required capabilities and onboarding fields.
  - Whether negotiated pricing carries over to new accounts under the team's contract.

## Integration Patterns

### Account types: Standard, Express, Custom

| Type | Who manages onboarding/dashboard | Liability for negative balances | Typical fit |
|---|---|---|---|
| **Standard** | Connected account uses their own full Stripe Dashboard, manages their own settings | Connected account | Platforms where the connected party is a sophisticated business with its own Stripe relationship |
| **Express** | Stripe-hosted, simplified onboarding and dashboard, branded as the platform | Shared (Stripe handles much of it) | Most marketplaces, e.g., gig economy, marketplace sellers |
| **Custom** | Platform builds 100% of the UI, connected account has no Stripe-branded UI | Platform (typically) | Platforms wanting full white-label control, highest integration effort and compliance responsibility |

**Recommendation pattern:** start with **Express** unless the team has a specific reason for Standard (connected accounts that are independent businesses wanting their own Stripe relationship) or Custom (full white-label requirement and the team has the resources for the additional compliance/UX work). [Unverified] Confirm current account type names and capabilities at https://stripe.com/docs/connect/accounts, Stripe has evolved this model (e.g., "embedded components" for Custom-like experiences) and details may have changed.

### Charge types

How a payment is structured between the platform and connected account:

- **Direct charges**: the connected account is the merchant of record, the charge happens on their account, the platform optionally takes an `application_fee_amount`. Funds go to the connected account, with the platform's fee transferred to the platform.
- **Destination charges**: the charge happens on the platform's account, funds are then transferred to the connected account (`transfer_data[destination]`) minus any `application_fee_amount`. Platform is the merchant of record.
- **Separate charges and transfers**: the platform charges the customer on its own account, and separately creates a `Transfer` to the connected account at a later time (e.g., after a payout schedule or business logic condition).

**Recommendation pattern:** use **destination charges** for most marketplace scenarios where the platform wants to be the merchant of record and control the customer relationship and refund policy. Use **separate charges and transfers** when the transfer to the connected account should be delayed or based on business logic (e.g., delivery confirmation) rather than happening immediately with the charge.

## Account Structure

Account structure, how many Stripe accounts are used, how they relate to each other, and which countries they're located in, has long-running implications for currency conversion, local acquiring rates, payout mechanics, reporting, and future country launches. Get this right early, changing it later is disruptive.

### Presentment vs. settlement currency

- **Presentment currency**: the currency the merchant (or the platform's connected accounts) accepts payments in from end customers.
- **Settlement currency**: the currency that is paid out to a bank account. In most cases, the bank account must be located in the country where the settlement currency is the official currency.
- A Stripe account can have **only one bank account per supported settlement currency**. [Unverified] Some account countries support multiple bank accounts/settlement currencies, confirm at https://stripe.com/docs/payouts#supported-accounts-and-settlement-currencies

### Unified vs. regional account structure

| | Unified (one Stripe account for multiple countries/currencies) | Regional (one Stripe account per country/region) |
|---|---|---|
| **Pros** | Single integration and unified reporting/dashboard across markets; simpler integration | Acquires in the local market with the best support for local payment methods; settles in like currency, no FX |
| **Cons** | May not support all local payment methods; causes cross-border acquiring, settlement, and FX | Adds reporting and integration complexity; no single holistic dashboard view |

A platform using `on_behalf_of` together with `application_fee` collection can accumulate and settle balances in the currencies of the destination payments it sends to connected accounts, by adding bank accounts for any currency it does not want auto-converted. This lets a single platform account behave somewhat like a multi-currency settlement hub without standing up additional regional accounts.

### Other account-structure considerations

- **Account country is fixed at activation.** Once a Stripe account has been activated, its country cannot be changed under current policy. Plan country selection carefully at account creation time, especially for accounts intended to serve as the long-term home for a market. [Unverified: confirm current policy against https://stripe.com/docs/connect/accounts.]
- **Negotiated pricing and account-specific features do not automatically carry over to new accounts.** If the team creates additional accounts later (e.g., to go regional), confirm with Stripe whether existing negotiated terms apply to the new account or need to be re-negotiated.

### Best practices

- Keep the number of Stripe accounts as small as possible while maximizing access to local acquiring and locally-relevant payment methods, every additional account adds integration and reporting overhead.
- Consider adding **additional settlement currencies** (extra bank accounts on an existing account, where supported) before standing up a new regional account, this can capture some of the benefits of "regional" settlement without the integration cost of a second account.
- Better authentication rates and potentially lower network costs typically come from acquiring locally; weigh this against the cost of additional accounts when scoping markets with materially different card networks (e.g., Cartes Bancaires in France).

This is a foundational decision with long-term cost and complexity implications, review with `sub-agents/solution-architect.md` (integration complexity, future country launches) and `sub-agents/finance-treasury.md` (FX costs, settlement currency choices, reporting fragmentation) before committing to a structure.

## Currency Conversion Mechanics

- **FX conversion rate**: Stripe converts at the daily mid-market rate, plus an FX fee (check the account's contract for the exact rate).
- **Cross-border scheme fees**: separate from FX fees, card networks charge a cross-border (or "cross-border acquiring") fee when a transaction is acquired in a different country than the country that issued the card. These vary by network and country. [Unverified] Illustrative example: Mastercard has been reported to charge around 0.60% of the transaction amount for transactions settled in USD on cards issued outside the US, confirm current rates with the team's Stripe contract.
- Because the mid-market rate fluctuates, the rate used for a refund can differ from the rate used for the original payment. For example (illustrative figures only): a $60.00 USD payment converting to EUR at a rate of 0.88 yields ~52.80 EUR on the merchant's balance; if refunded later when the rate has moved to 0.86, the refund debits ~51.60 EUR from the balance, a difference the business absorbs or accounts for.

### Charge-type currency determination

Which account's country (and therefore default settlement currency) governs the conversion depends on the charge type used:

| Charge type | Currency determined by |
|---|---|
| Direct charges | Country of the connected account |
| Destination charges | Country of the platform account |
| Destination charges using `on_behalf_of` | Country of the connected account |
| Separate charges and transfers | Country of the platform account |
| Separate charges and transfers using `on_behalf_of` at charge time | Country of the connected account |

This table is a frequent source of surprises during scoping, confirm the intended charge type against the desired settlement currency/account before implementation, with `sub-agents/solution-architect.md` and `sub-agents/finance-treasury.md`.

## Code Examples

### 1. Create an Express connected account and onboarding link (Node.js)

```javascript
// Step 1: create the connected account
const account = await stripe.accounts.create({
  type: 'express',
  country: 'US', // country of the connected account
  email: sellerEmail,
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
});

// Step 2: create an onboarding link for the seller to complete KYC
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: 'https://example.com/reauth',
  return_url: 'https://example.com/onboarding-complete',
  type: 'account_onboarding',
});

// Redirect the seller to accountLink.url to complete onboarding
```

Store `account.id` against the seller's record in your database, this is how you reference them in future API calls.

### 2. Destination charge with platform fee (Node.js)

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // e.g., $100.00
  currency: 'usd',
  automatic_payment_methods: { enabled: true },
  application_fee_amount: 1000, // platform keeps $10.00
  transfer_data: {
    destination: connectedAccountId, // e.g., "acct_..."
  },
}, {
  idempotencyKey: `pi_create_${orderId}`,
});
```

The connected account receives `amount - application_fee_amount` (minus any Stripe fees, depending on fee responsibility configuration).

### 3. Separate charge and transfer (Node.js)

```javascript
// Charge happens on the platform account (standard PaymentIntent, see payments.md)
// ... later, after business logic confirms the transfer should happen:

const transfer = await stripe.transfers.create({
  amount: 9000, // amount to send to the connected account
  currency: 'usd',
  destination: connectedAccountId,
  source_transaction: chargeId, // ties the transfer to the original charge for tracking
}, {
  idempotencyKey: `transfer_${orderId}`,
});
```

### 4. Webhook events relevant to Connect

```javascript
switch (event.type) {
  case 'account.updated': {
    const account = event.data.object;
    // Check account.charges_enabled / account.payouts_enabled
    // to know when onboarding requirements are satisfied
    break;
  }
  case 'payout.paid': {
    const payout = event.data.object;
    // Record payout for reconciliation, this event is on the connected account
    break;
  }
  case 'payout.failed': {
    const payout = event.data.object;
    // Alert: connected account's payout failed (e.g., bad bank details)
    break;
  }
  case 'application_fee.refunded': {
    // Platform fee was refunded as part of a charge refund
    break;
  }
}
```

[Unverified] For Connect, some webhook events arrive on the connected account rather than the platform account. Confirm event routing/Connect webhook configuration at https://stripe.com/docs/connect/webhooks

### 5. Account debits (pulling funds back from a connected account)

Sometimes the platform needs to collect funds from a connected account, e.g., to bill them directly for products or services, recover funds from a previous over-transfer, or correct a balance error. This creates a **Transfer** on the connected account (debiting it) and a **Charge** on the platform account (crediting it):

```javascript
const charge = await stripe.charges.create({
  amount: 10000,
  currency: 'usd',
  source: connectedAccountId, // the connected account being debited
}, {
  idempotencyKey: `account_debit_${reason}_${connectedAccountId}`,
});
```

### 6. Reverse a transfer when refunding a destination charge

By default, the connected account keeps the funds transferred to it even if the original charge is refunded. To claw back funds from the connected account to cover the refund, reverse the transfer alongside the refund:

```javascript
// Refund the customer
const refund = await stripe.refunds.create({
  charge: chargeId,
});

// Reverse the corresponding transfer to pull funds back from the connected account
const reversal = await stripe.transfers.createReversal(transferId, {
  amount: refundAmount, // can be a partial reversal
});
```

Some network costs are refunded based on the card network and issuing bank: the portion of interchange returned depends on the card type, and Stripe's variable (volume) fee is refunded but its fixed per-authorization fee is not. See pitfall #3 above for the related `refund_application_fee` decision on the platform's own fee.

## Common Implementation Pitfalls

1. **Treating onboarding as complete when the account is created.** Account creation does not mean the connected account can accept payments or receive payouts. Check `charges_enabled` and `payouts_enabled` (via `account.updated` webhook or by retrieving the account) before allowing the connected account to go live.

2. **Not handling incomplete onboarding gracefully.** Sellers often abandon onboarding partway through. The platform needs a way to detect this (via `account.updated` or periodic checks) and prompt the seller to finish, using a fresh `accountLink` (links expire).

3. **Refunds and platform fees.** When refunding a destination charge, decide whether the `application_fee_amount` should also be refunded (`refund_application_fee` parameter). If finance expects the platform to keep its fee on refunds, this needs to be set explicitly, the default behavior may not match expectations.

4. **Currency mismatches between platform and connected account.** If the connected account's default currency differs from the charge currency, Stripe performs a currency conversion for the transfer, which has FX implications. Confirm with `finance-treasury` whether this is expected.

5. **Negative balances on connected accounts.** If a connected account is refunded or disputed after funds have already been paid out to them, their Stripe balance can go negative. **Standard connected accounts are always ultimately liable for covering their own negative balances.** For **Express and Custom accounts, the platform is ultimately liable**.

   To recover a negative balance directly from a connected account's external bank account, set `debit_negative_balances: true` on the account, this is only available for accounts in supported countries (Australia, Canada, Europe/SEPA including the UK, New Zealand, and the US, [Unverified] confirm at https://stripe.com/docs/connect/account-balances). Notes on this behavior:
   - While an account's balance is negative, payments to its bank account or debit card are paused, normal payouts resume once the balance is positive again.
   - If the external-account debit itself fails, Stripe disables that external account, which can in turn cause debits against the *platform's* bank account if the platform doesn't have sufficient incoming volume to cover the shortfall that day.

   Review the chosen liability and `debit_negative_balances` configuration with `sub-agents/finance-treasury.md` and `sub-agents/compliance-officer.md`.

6. **Hardcoding country-specific capability requirements.** Required capabilities (`card_payments`, `transfers`, etc.) and required onboarding fields vary by country. Do not assume the same onboarding flow works for every connected account's country.

7. **Confusing platform-level keys with connected account context.** API calls that should act "as" or "for" a connected account need the `Stripe-Account` header (or the equivalent SDK option), forgetting this causes operations to act on the platform account instead.

## Relevant Stripe Documentation

- Connect overview: https://stripe.com/docs/connect
- Account types: https://stripe.com/docs/connect/accounts
- Express accounts: https://stripe.com/docs/connect/express-accounts
- Charges and transfers (Connect money movement): https://stripe.com/docs/connect/charges-transfers
- Connect webhooks: https://stripe.com/docs/connect/webhooks
- Account onboarding (Account Links): https://stripe.com/docs/connect/account-links
- Platform fees: https://stripe.com/docs/connect/direct-charges#collecting-fees
- Account balances and negative balances: https://stripe.com/docs/connect/account-balances
- Payouts, supported accounts and settlement currencies: https://stripe.com/docs/payouts#supported-accounts-and-settlement-currencies
- Account debits: https://stripe.com/docs/connect/account-debits
- Reporting and reconciliation: see `psps/stripe/reports.md`
