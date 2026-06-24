# Stripe: Crypto Onramp

Covers Stripe's embeddable fiat-to-crypto conversion product (the Crypto Onramp). Relevant for Web3 platforms, NFT marketplaces, DeFi apps, and crypto wallets that want to let users buy crypto without leaving the product, while Stripe acts as the merchant of record and handles KYC, sanctions screening, fraud, and disputes.

This is a different product surface from stablecoin payments and Treasury (see `stablecoins.md`). The Crypto Onramp is a customer-journey product (the end user buys crypto for their own wallet); stablecoin payments are a payment-rail product (the merchant accepts crypto as payment for something). Some engagements include both, but the integration patterns and the customer conversation are different.

**Volatility note.** Several Crypto Onramp capabilities documented below are tagged as 2026 additions, with some in private preview. Verify each capability against the canonical docs before scoping; the preview-vs.-GA boundary and per-country availability shift quickly.

## Verification References

Use these pointers during `/validate-context` and before generating final integration code for this product line. The product-line file below describes the integration model and integration modes; supported tokens and chains, per-country availability, KYC mode thresholds, headless-mode availability, and the KYC-sharing private preview gating must be re-verified against the sources here.

- **Canonical docs:**
  - https://stripe.com/docs/crypto/onramp covers the Crypto Onramp overview and supported integration modes
  - https://stripe.com/docs/crypto/onramp/quickstart covers the embeddable component integration on web and mobile
  - https://stripe.com/docs/crypto/onramp/headless covers the headless API mode (US preview at authoring)
  - https://stripe.com/docs/crypto/onramp/kyc covers KYC requirements, KYC modes (including the lower-threshold mode), and KYC sharing where available
  - https://stripe.com/docs/crypto/onramp/supported-assets covers supported tokens, chains, and per-region availability
  - https://stripe.com/docs/crypto/onramp/payment-methods covers supported payment methods on the customer side
- **API Changelog:** https://stripe.com/docs/upgrades, watch for changes to the Onramp session API shape, headless-mode endpoint naming, KYC mode parameter values, and custom-stablecoin support flags.
- **Stripe MCP hints (if connected):**
  - To check the team's current Crypto Onramp configuration (enabled assets, supported regions for this account), query the Onramp configuration via the API reference.
  - To check whether headless mode is enabled for the account, attempt a headless session create in test mode and inspect the error/response.
  - To check whether the KYC-sharing private preview is enabled for the account, query Stripe Support or the account team; this is not generally inspectable via the API.
- **What to re-verify before relying on this file:**
  - Supported tokens and chains per region; the list evolves and is not symmetric across regions.
  - Per-country availability of the Onramp itself (not all countries supported), and per-country payment-method support.
  - Current KYC mode thresholds (the $500 mode at authoring; verify whether the threshold or the modes have changed).
  - Headless mode availability (US-only at authoring, may extend).
  - Custom stablecoin (Open Issuance) support in the Onramp: which assets, which regions.
  - KYC sharing across Stripe products: scope, opt-in mechanism, and whether out of private preview.
  - Fees the customer sees: network fee, Stripe fee, conversion spread; current presentation requirements.

## Product Model

The Crypto Onramp is an end-customer fiat-to-crypto purchase product. The integration's responsibility is to embed the experience and provide the destination wallet address; Stripe handles everything else end to end:

- **KYC**: Stripe collects and verifies customer identity, including the lower-threshold KYC mode (currently up to $500 at authoring; verify) for smaller purchases.
- **Sanctions screening and fraud prevention**: applied as part of the Stripe-managed flow.
- **Payment collection**: credit, debit, Apple Pay, Google Pay, instant ACH, and regular ACH, depending on region and account.
- **Crypto purchase and delivery**: Stripe executes the purchase and delivers the crypto to the destination wallet address the integration provided.
- **Disputes and reversals**: handled by Stripe as the merchant of record.

**The integration does not need a money transmitter license** because Stripe is the merchant of record across the whole flow. This is the central commercial reason platforms adopt the Onramp over building a comparable flow themselves; preserve this property by not adding integration logic that would put the platform in the flow of funds.

## Integration Modes

Three modes, in increasing order of integration effort and UX control:

### Mode A: No-code hosted page

Stripe-hosted page; the integration redirects the customer to the hosted URL with the destination wallet address and optional pre-filled fields, the customer completes the flow on Stripe, and is redirected back. Right when the team wants the lowest-effort path or is testing demand without committing to integration work.

### Mode B: Embeddable component (web and mobile)

A Stripe-provided component the integration drops into its own UI. The Onramp UI lives inside the integration's product surface but is rendered by Stripe; the integration controls placement and surrounding context. Right for most production integrations: substantially better UX than redirecting, while preserving Stripe's merchant-of-record position. Available on web and on mobile (iOS, Android) via the respective Stripe SDKs.

### Mode C: Headless (custom UI, US private preview at authoring)

The integration builds its own UI for the Onramp experience and calls Stripe's headless Onramp API to drive each step. Stripe still handles KYC, payment, and crypto delivery; the integration handles every pixel of the customer-facing UI.

Headless is US-only in private preview at authoring. Use only when the embeddable component is genuinely insufficient (e.g., a fully custom Web3 wallet UX where the embedded component is a visual mismatch). The integration takes on more UX responsibility and more burden of staying current with KYC and disclosure requirements that Stripe surfaces in the embedded component automatically.

Mode choice is a `sub-agents/solution-architect.md` (integration effort, maintenance), `sub-agents/frontend-developer.md` (UX fit, mobile vs. web), and `sub-agents/compliance-officer.md` (disclosure surface ownership, especially for headless) decision.

## KYC Modes and KYC Sharing

### Standard KYC

The default mode: Stripe collects full KYC (identity document, selfie, address verification depending on region) before the customer can complete a purchase. Supports the largest per-transaction and per-customer limits.

### Lower-threshold KYC mode (up to $500 at authoring)

A reduced-KYC mode for transactions up to a low threshold (currently $500). Reduces friction for first-time small purchases. The customer can step up to standard KYC later for larger purchases. [Unverified] Verify the current threshold and the exact reduced fields required; both have shifted across releases.

The mode is selected at session creation. The integration must handle the case where the customer's intended purchase exceeds the lower-mode threshold and step up to standard KYC mid-flow, or surface this to the customer before they begin.

### KYC sharing (private preview at authoring)

Stripe is rolling out KYC sharing so a customer who has already completed KYC on one Stripe product surface (e.g., Onramp) does not need to repeat it on another. This is in private preview and gated per account at authoring; confirm availability with the Stripe account team before designing flows that depend on it.

KYC sharing changes the customer-onboarding journey materially: it makes "completes KYC once, uses it across products" a real pattern, which can reshape what features a platform offers as a single integrated experience versus separate flows. This is a strategic consideration for `sub-agents/head-of-payments.md` (product surface design) and an operational one for `sub-agents/compliance-officer.md` (defensibility of cross-product KYC reuse in the team's markets).

## Integration Patterns

### Pattern: embeddable component (web)

The recommended starting point for most production integrations.

**Server: create an Onramp session.**

```javascript
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post('/onramp/session', async (req, res) => {
  const { walletAddress, network, asset } = req.body;

  const session = await stripe.crypto.onrampSessions.create({
    transaction_details: {
      destination_currency: asset,             // e.g., 'usdc', 'eth', 'sol'
      destination_network: network,            // e.g., 'ethereum', 'solana', 'base'
      destination_wallet_address: walletAddress,
      supported_destination_networks: [network],
      supported_destination_currencies: [asset],
    },
    customer_information: {
      email: req.user.email,
    },
  });

  res.json({ clientSecret: session.client_secret });
});
```

[Unverified] Field names and the `crypto.onrampSessions` namespace under the `stripe` SDK have evolved; confirm against the current SDK and API reference before integrating.

**Client: mount the embedded component.**

```javascript
import { loadStripeOnramp } from '@stripe/crypto';

const stripeOnramp = await loadStripeOnramp(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const onrampSession = stripeOnramp.createSession({ clientSecret });
onrampSession.mount('#onramp-element');

onrampSession.addEventListener('onramp_session_updated', (event) => {
  // event.payload.session.status: 'initialized' | 'rejected' | 'requires_payment'
  //                              | 'fulfillment_processing' | 'fulfillment_complete'
  // Update internal records and UI based on the session lifecycle.
});
```

Wire the `onramp_session_updated` listener to your internal state machine. The session moves through identified states; the integration should not treat the customer as having received crypto until `fulfillment_complete`.

### Pattern: hosted page (no-code)

Skip the client component; redirect the customer to `session.redirect_url` (or the equivalent field in the current API), and handle the post-fulfillment webhook on the integration's side.

### Pattern: webhook handling (all modes)

```javascript
switch (event.type) {
  case 'crypto.onramp_session.created':
    // New session created; record for tracking
    break;
  case 'crypto.onramp_session.updated':
    // Session moved between states (KYC submitted, payment authorized, etc.)
    break;
  case 'crypto.onramp_session.fulfillment_complete':
    // Crypto delivered to the destination wallet
    // This is the trigger to mark the customer's purchase complete in the integration's records.
    break;
  case 'crypto.onramp_session.fulfillment_failed':
    // Fulfillment failed; surface to the customer and to support
    break;
  default:
    break;
}
```

[Unverified] Confirm current Onramp webhook event names against https://stripe.com/docs/crypto/onramp before wiring handlers; event naming has shifted between releases.

## Custom Stablecoin Support (Open Issuance)

For platforms that have launched a custom stablecoin via Open Issuance (see `stablecoins.md` Open Issuance section), the Crypto Onramp can be configured to deliver the custom stablecoin as a purchase destination, in regions where the asset is supported. This lets a platform offer "buy your in-product dollar with a card" as a single user-facing action.

[Unverified] Custom-stablecoin Onramp support is one of the 2026 additions; verify which Open Issuance assets are eligible and which regions support delivery before scoping this for the team.

## Fees, Disclosures, and Customer-Facing Surfaces

Fees the customer pays are a combination of network fees (on-chain gas), Stripe's conversion fee, and any spread; the breakdown is presented to the customer in the Stripe-managed UI as part of the flow. In headless mode, the integration is responsible for presenting the fee breakdown accurately, using Stripe's canonical fields.

Regulatory disclosures (e.g., "you are purchasing crypto, value can fluctuate, transactions are irreversible") are presented by Stripe in the hosted page and embedded component automatically. In headless mode, the integration renders them; deviation from Stripe's canonical wording is a regulatory exposure for the platform.

This is a `sub-agents/compliance-officer.md` and `sub-agents/frontend-developer.md` review point, particularly for headless integrations.

## Regulatory Framing

The Onramp's commercial value depends substantially on Stripe being the merchant of record and the regulated party. The integration's responsibilities are still real:

- **Destination wallet ownership**: the platform is responsible for ensuring the destination wallet address belongs to the customer who is buying. Different platform models handle this differently (a wallet the platform itself manages for the customer, a wallet the customer connects, a wallet the customer types). Confirm the customer-to-wallet binding is defensible with `sub-agents/compliance-officer.md`.
- **Sanctions exposure on the wallet side**: while Stripe screens the customer, the destination wallet address may also need to be screened in some markets. Confirm where the responsibility sits.
- **Customer journey claims**: marketing copy around the Onramp ("buy crypto in seconds", fee claims, "no fees" claims) is subject to consumer-protection rules in every market the platform operates in. Stripe does not vet the integrator's marketing.
- **Tax reporting**: in some jurisdictions, the platform may have customer-facing tax-reporting obligations related to crypto purchases (1099 in the US, equivalents elsewhere), even when Stripe is the merchant of record. Verify with outside counsel.

As with stablecoins (see `stablecoins.md` Regulatory and Operational Framing), outside counsel review is the bar before any customer-facing Onramp integration goes live.

## Common Pitfalls

1. **Treating the Onramp as a payment method.** The Onramp is a customer-purchase product, not a payment-acceptance product. Conflating the two leads to wrong scoping (the team thinks they are adding crypto acceptance for their merchandise; they are actually adding a separate fiat-to-crypto purchase flow for their users).

2. **Putting the platform in the flow of funds.** Adding logic that briefly holds, redirects, or restructures the funds anywhere in the Onramp flow risks invalidating the "Stripe as merchant of record" property and pulling the platform into money-transmitter territory. Keep the integration's role to: provide destination wallet, surface the flow, react to webhooks.

3. **Hardcoding KYC behavior around the standard mode.** The lower-threshold mode and (preview) KYC sharing change the customer's path. Design state machines to handle "customer already KYC'd via another Stripe product" and "customer used reduced-KYC mode and now wants to exceed the threshold" as first-class flows.

4. **Skipping `fulfillment_complete` validation.** A successful payment-collection state is not crypto-delivered. The integration should not mark a purchase complete until the `fulfillment_complete` webhook arrives or the session status reflects it.

5. **Building headless first.** Headless mode adds substantial responsibility (disclosure rendering, UX flow correctness, regulatory text accuracy) for a marginal UX gain over the embedded component for most integrations. Start with embedded; move to headless only if a concrete UX requirement justifies it.

6. **Forgetting per-region asymmetry.** Supported tokens, supported chains, supported payment methods, and supported KYC modes vary by country. A flow that works for US customers may fail silently for EU customers; build for the regions the team actually serves and verify each.

7. **Assuming wallet-address validation is universal.** Different chains have different address formats. Validating the destination address client-side (chain-appropriate format check) before session creation is a low-cost guard against the unrecoverable-typo failure mode.

## Relevant Stripe Documentation

- Crypto Onramp overview: https://stripe.com/docs/crypto/onramp
- Embeddable component quickstart: https://stripe.com/docs/crypto/onramp/quickstart
- Headless mode (US preview): https://stripe.com/docs/crypto/onramp/headless
- KYC, KYC modes, KYC sharing: https://stripe.com/docs/crypto/onramp/kyc
- Supported assets and regions: https://stripe.com/docs/crypto/onramp/supported-assets
- Payment methods supported on the customer side: https://stripe.com/docs/crypto/onramp/payment-methods
- Custom stablecoin support via Open Issuance: see `psps/stripe/stablecoins.md` Open Issuance section
- Stablecoin payments (separate product surface, not the Onramp): see `psps/stripe/stablecoins.md`
