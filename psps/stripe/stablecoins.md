# Stripe: Stablecoins

Covers Stripe's stablecoin capabilities, the cross-cutting topic that touches Payments (Optimized Checkout acceptance), Billing (recurring stablecoin payments), Treasury (stablecoin financial accounts, on-chain payouts), Issuing (cards spending stablecoin balances), and Open Issuance via Bridge (platforms launching their own branded stablecoin). This file is the canonical reference for the regulatory model, supported assets, settlement and FX implications, and the Open Issuance program. Each consumer product line has a short cross-reference subsection in its own file (`payments.md`, `billing.md`, `treasury.md`, `issuing.md`) that defers to this one for the cross-cutting model.

**Volatility note.** Stripe's stablecoin surface expanded substantially after the Bridge acquisition and is still moving quickly, both in product capability and in surrounding regulation (US federal-level proposals, EU MiCA implementation, UK and APAC frameworks, sanctions-list updates). Treat product-status claims in this file as accurate at authoring time and verify each capability against the canonical docs before relying on it in a customer-facing flow. The Verification References block below is the contract that `/validate-context` runs against.

## Verification References

Use these pointers during `/validate-context` and before generating final integration code for this product line. The product-line file below describes the shape of the product and the cross-cutting integration concerns; supported assets, supported chains, per-country availability, settlement timing, and Open Issuance access change frequently and must be re-verified against the sources here.

- **Canonical docs:**
  - https://stripe.com/docs/crypto covers Stripe's overall crypto and stablecoin product surface
  - https://stripe.com/docs/stablecoins covers stablecoin payments via Optimized Checkout, supported assets, refund mechanics
  - https://stripe.com/docs/treasury/stablecoin-financial-accounts covers stablecoin balances in Treasury (US businesses), conversion, on-chain payouts
  - https://stripe.com/docs/issuing/cards/stablecoin covers Issuing card spend funded from a stablecoin balance
  - https://bridge.xyz/docs covers the Bridge platform and Open Issuance (Stripe acquired Bridge; documentation is consolidating onto stripe.com over time)
  - https://stripe.com/blog/bridge-acquisition is the announcement of context for the Open Issuance and stablecoin-financial-accounts expansion
- **API Changelog:** https://stripe.com/docs/upgrades, watch for changes to stablecoin payment-method type names, Treasury stablecoin balance object shape, and any Bridge-API method exposure under the `stripe` SDK namespace.
- **Stripe MCP hints (if connected):**
  - To check whether stablecoin payments are enabled on the connected account, list available payment methods on a PaymentIntent or query the account's payment-method configuration via the API reference.
  - To check whether the account is eligible for stablecoin financial accounts under Treasury, query Treasury capabilities on the account (US-only at authoring).
  - To check current Open Issuance availability, query the canonical docs (the program is platform-by-platform enabled).
- **What to re-verify before relying on this file:**
  - Supported stablecoin assets per surface (which tokens are accepted in Optimized Checkout, which can be held in Treasury, which can be issued via Open Issuance).
  - Supported chains per asset and surface (Ethereum, Solana, Base, Polygon, others).
  - Per-country availability for stablecoin acceptance, Treasury stablecoin balances, and on-chain payouts.
  - Settlement timing: fiat-equivalent settlement (Stripe converts on-chain to fiat for the merchant) vs. settle-in-stablecoin (merchant keeps the stablecoin balance) availability per country and per asset.
  - Open Issuance access (currently platform-by-platform enabled, with named launches; verify whether the team's platform is currently eligible).
  - Refund mechanics for stablecoin payments: whether the refund returns to the customer's wallet on-chain, refund window per asset, gas/fee handling.
  - Sanctions screening and Travel Rule expectations on outbound on-chain transfers from Treasury accounts.
  - Regulatory status in the team's markets: US state-level money-transmitter exposure, EU MiCA stablecoin issuer/CASP categorization, UK FCA position, equivalents elsewhere. This list moves; do not treat any prior memo as current.

## Regulatory and Operational Framing

Stablecoin integrations sit on top of a regulatory landscape that changes faster than this document can keep up with. Before any customer-facing stablecoin work goes live:

- **Outside counsel review is the bar, not an option.** This file documents how to integrate with Stripe's stablecoin product; it does not opine on whether the team is licensed to do what they want to do in a given market. EU MiCA, US state MTL exposure, UK FCA cryptoasset registration, and equivalents in other markets each have nuance the EM is not positioned to resolve. `sub-agents/compliance-officer.md` flags this and stops; the actual sign-off is outside counsel's.
- **Stripe as the merchant of record reduces, but does not eliminate, the team's exposure.** For Optimized Checkout stablecoin acceptance, Stripe is the merchant of record for the payment, similar to fiat acceptance: the team is not handling raw on-chain funds. For Treasury stablecoin balances and on-chain payouts, the platform's responsibility expands materially (sanctions screening on outbound counterparties, Travel Rule data exchange where applicable, customer disclosures, complaints handling). Scope the responsibility model with `head-of-payments` and `compliance-officer` before promising features.
- **Stablecoins are not "crypto" for most purposes.** Customers often conflate the two. In product copy, integration patterns, and decision conversations, hold the distinction: stablecoins are dollar-pegged (or other fiat-pegged) tokens used as a payment and settlement rail; broader crypto-asset trading is a separate product surface (`crypto-onramp.md`).

## Stripe's Stablecoin Surface

Three product surfaces, each with its own integration pattern. Most engagements touch one or two; some marketplace engagements touch all three.

### 1. Stablecoin Payments via Optimized Checkout

Stablecoin acceptance appears as a payment method in Stripe's Optimized Checkout Suite (Payment Element, Checkout Sessions, Payment Links). When enabled in the Dashboard, supported stablecoins surface alongside cards, wallets, and bank rails without per-method integration code.

- **Where it surfaces**: the Payment Element (`automatic_payment_methods: { enabled: true }`), Checkout Sessions, Payment Links. See `payments.md` for the cross-reference subsection and integration notes specific to acceptance.
- **Recurring**: Billing supports stablecoin-funded subscriptions via the same Payment Element flow. See `billing.md` for recurring-specific behavior (mandate-equivalent semantics, failed-payment handling for on-chain reasons).
- **Settlement options**: depending on the team's account and market, Stripe can settle the merchant in fiat (Stripe converts on-chain at acceptance) or hold the stablecoin balance for the merchant (settle-in-stablecoin). Settlement mode is account-level configuration, not per-PaymentIntent. [Unverified] Per-market availability of settle-in-stablecoin shifts; verify before promising the team a specific settlement model.
- **Refunds**: refund mechanics differ from card. Refunds may flow back to the customer's wallet on-chain (refund destination is determined at acceptance time) and have different window and finality semantics than cards. Cover with the team's support process during scoping.
- **Disputes**: on-chain payments do not have card-network chargebacks, so the dispute model is fundamentally different. Stripe handles fraud and disputes on the acceptance side as merchant of record, but the team's support process should not expect the card-network dispute flow (see `fraud-and-disputes.md`) for stablecoin payments.

This surface is the lowest-effort stablecoin entry point. For most platforms exploring stablecoins, start here.

### 2. Stablecoin Financial Accounts via Treasury (US businesses)

Treasury financial accounts (covered in `treasury.md`) can hold stablecoin balances alongside fiat, in jurisdictions where this is available. At authoring this is US-only; re-verify before scoping for a non-US team.

Capabilities, all subject to Treasury enablement and per-account capability grants (see `treasury.md` Prerequisites):

- **Hold stablecoin balances** on the financial account, denominated in supported tokens.
- **Convert between fiat and stablecoin** on-account (Stripe handles the on-chain leg).
- **Send stablecoins on-chain** to external wallets via OutboundPayment-equivalent flows. Subject to sanctions screening, address allowlisting, and Travel Rule data exchange where applicable.
- **Receive stablecoins on-chain** into the financial account from external wallets.
- **Card spend from a stablecoin balance**: an Issuing card linked to a financial account whose primary balance is stablecoin. Authorizations convert to fiat at the network (Stripe handles the conversion at authorization time). See `issuing.md` for the Issuing side.

Treasury stablecoin balances are typically the right surface for platforms with cross-border payouts (gig economy, creator economy, contractor-facing marketplaces), because stablecoin payouts are dramatically faster and cheaper than wire/SWIFT for many corridors. They are not a magic FX solution: on-ramping fiat to stablecoin and off-ramping back to local currency at the recipient end each has cost, timing, and counterparty considerations.

This surface materially expands the team's operational responsibilities. ACH return mechanics do not apply (on-chain is final at confirmation), but new failure modes appear: address typos sending funds to unrecoverable destinations, network congestion delaying settlement, wallet provider counterparty risk. Model these explicitly with `sub-agents/backend-developer.md` and `sub-agents/finance-treasury.md` during scoping.

### 3. Open Issuance via Bridge

Open Issuance is the Bridge-derived platform for launching a custom branded stablecoin. Stripe (via Bridge) handles reserve management, on-chain issuance and burn, asset backing, and a portion of the regulatory model; the platform brands and distributes the stablecoin to its end users.

Reference launches at authoring:

- **Phantom's CASH** is the first stablecoin issued through Open Issuance.
- **Deel** uses an Open Issuance asset to let contractors worldwide hold, earn, and spend dollar-backed balances.

This file does not provide a runnable how-to for Open Issuance. The program is platform-by-platform enabled, the integration surface is bespoke per launch, and the public API surface is consolidating from Bridge onto Stripe over time. What this file does cover is the scoping conversation:

- **When a platform should consider Open Issuance**: when the platform has a large user base with cross-border payout, savings, or in-product spending needs, and the platform wants a branded "in-product dollar" rather than routing users to an external stablecoin. The decision is brand-strategic and operational, not primarily technical.
- **What the platform commits to**: ongoing regulatory positioning (the platform is the issuer in a brand-perception sense even if Bridge holds reserves), customer disclosures, complaints handling, marketing-compliance review on every customer-facing surface that references the asset.
- **What Stripe/Bridge commits to**: reserve management, the on-chain mechanics of issuance and burn, integration with the rest of the Stripe stablecoin surface so the branded stablecoin can flow through Optimized Checkout, Treasury, and Issuing where applicable.
- **What is open**: the regulatory positioning of branded stablecoins is evolving fast across jurisdictions; what worked for a launch six months ago may need re-papering today.

Open Issuance is a `head-of-payments` (strategic placement, brand decision), `compliance-officer` (outside-counsel-required regulatory positioning), and `finance-treasury` (reserve-economics and treasury-management implications) conversation before it is a `backend-developer` (integration) one. Sequence the scoping accordingly.

## Cross-Cutting Patterns

The following patterns apply across more than one surface and are documented once here rather than in each consumer file.

### Catalog and pricing in stablecoin terms

Most stablecoin-accepting flows still price in fiat (USD, EUR, GBP) and accept payment in a stablecoin valued against that fiat at acceptance time. Pricing directly in a stablecoin (e.g., a Price denominated in USDC) is supported in narrower cases; if this is in scope, verify support against the canonical docs and align with the catalog model in `products-and-prices.md`.

### Ledger model with dual-currency balances

For platforms holding both fiat and stablecoin balances via Treasury, the internal ledger needs to represent both currencies and the conversions between them, with audit-trail granularity. Single-balance ledger models (one "available cash" number) become misleading the moment a meaningful stablecoin balance exists. This is a `sub-agents/backend-developer.md` and `sub-agents/finance-treasury.md` design point, called out under `treasury.md` as well.

### Settlement timing reasoning

For Optimized Checkout stablecoin acceptance with fiat settlement, settlement timing depends on Stripe's on-chain confirmation and conversion windows, which differ from card timing. Marketplaces that combine card and stablecoin acceptance see two distinct settlement cadences; reflect this in payout and reconciliation expectations. See `reports.md` for the reconciliation side.

### Refunds, reversibility, and dispute substitutes

On-chain payments are functionally irreversible once confirmed; the refund flow uses Stripe's merchant-of-record position to send a new on-chain transaction back to the customer's wallet, not to reverse the original. Operational consequences:

- **Wrong-amount refunds cannot be unrolled cheaply.** Build refund workflows around manual review for non-trivial amounts.
- **No card-network dispute path means support resolution is the only path.** Make sure customer support has a working tool for stablecoin payment disputes that does not assume the card-dispute UI.
- **Friendly fraud profile is different.** Lower for irreversible on-chain payments at acceptance, but higher for any platform-managed balance where the user can claim "unauthorized withdrawal" against the platform.

### Sanctions and Travel Rule on outbound

For Treasury stablecoin outbound flows (sending to external wallets), the platform's compliance program needs to:

- Screen the destination wallet against OFAC and equivalent sanctions lists at submission time.
- Apply Travel Rule data exchange where the corridor and value trigger it (this is jurisdiction-specific; the threshold matrix is moving).
- Maintain ongoing wallet allowlist / blocklist with audit trail.

Stripe provides screening as part of the outbound flow, but the platform is the obligated party for its own customers. Confirm where the responsibility line sits with `sub-agents/compliance-officer.md` and `sub-agents/security-officer.md`.

## Cross-References to Consumer Files

Each consumer file has a short subsection deferring to this file for the cross-cutting model:

- **Acceptance via Payment Element / Checkout / Payment Links**: see `payments.md` "Stablecoin payments via Optimized Checkout".
- **Recurring stablecoin subscriptions**: see `billing.md` "Stablecoin subscriptions".
- **Treasury stablecoin balances, conversion, on-chain payouts**: see `treasury.md` "Stablecoin financial accounts".
- **Issuing card spend from a stablecoin balance**: see `issuing.md` "Spending stablecoin balances".

If the engagement also includes fiat-to-crypto onramping for end users (separate product surface), see `crypto-onramp.md`.

## Common Pitfalls

1. **Treating stablecoin acceptance as "just another payment method."** Refund, dispute, and reconciliation semantics differ enough from cards that the team's existing support and finance processes will not transfer cleanly. Walk through the post-acceptance flows with the team explicitly, not just the acceptance flow.

2. **Promising a settlement model that depends on per-market availability.** Settle-in-stablecoin vs. settle-in-fiat availability is account- and market-specific. Verify before scoping the team's reconciliation and treasury model around a specific mode.

3. **Underestimating Open Issuance regulatory commitment.** Standing up a branded stablecoin commits the platform to ongoing regulatory posture across every market it operates in, even when Bridge handles the reserves. Scope this as a multi-quarter program, not a sprint.

4. **Building a single-currency ledger and adding stablecoins later.** Retrofitting a dual-currency ledger after balances are non-trivial is painful. If stablecoin Treasury balances are even possibly in scope within the next year, design the ledger for it now.

5. **Confusing stablecoin payments with the broader crypto-onramp product.** They are different surfaces with different integration patterns and different customer journeys. Stablecoins are a payment/settlement rail; the onramp is a fiat-to-crypto conversion product for end users. See `crypto-onramp.md`.

6. **Assuming "Bridge is just a backend"**. Bridge's role in Open Issuance is material: reserve management, on-chain mechanics, and a portion of the regulatory model. The platform is not a passive front-end. Treat the Bridge integration as a substantive partner relationship with operational responsibilities on both sides.

7. **Skipping the on-chain "wrong address" failure mode.** Outbound on-chain transfers to a typo'd address are typically unrecoverable. UX patterns to mitigate (address-book allowlisting, small-amount test transfer before large transfer, address-format validation, recipient confirmation step) belong in the design from the start, not as a v2 hardening pass.

## Relevant Stripe Documentation

- Crypto and stablecoins overview: https://stripe.com/docs/crypto
- Stablecoin payments (Optimized Checkout): https://stripe.com/docs/stablecoins
- Treasury stablecoin financial accounts: https://stripe.com/docs/treasury/stablecoin-financial-accounts
- Issuing cards funded from stablecoin balance: https://stripe.com/docs/issuing/cards/stablecoin
- Bridge / Open Issuance: https://bridge.xyz/docs
- Acceptance integration: see `psps/stripe/payments.md` Stablecoin payments subsection
- Recurring subscriptions: see `psps/stripe/billing.md` Stablecoin subscriptions subsection
- Treasury integration: see `psps/stripe/treasury.md` Stablecoin financial accounts subsection
- Issuing integration: see `psps/stripe/issuing.md` Spending stablecoin balances subsection
- Fiat-to-crypto onramping for end users (separate product): see `psps/stripe/crypto-onramp.md`
