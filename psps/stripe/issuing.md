# Stripe: Issuing

Covers Stripe Issuing: cardholder and card creation, spending controls, authorization webhooks, and funding. Relevant for businesses that need to issue virtual or physical cards to users, employees, contractors, or customers (e.g., expense cards, payout cards, virtual cards for purchasing).

## Verification References

Use these pointers during `/validate-context` and before generating final integration code for this product line. The product-line file below describes stable patterns; cardholder requirements, real-time authorization timeouts and default behavior, funding mechanics, and PAN-display flow must be re-verified against the sources here.

- **Canonical docs:**
  - https://stripe.com/docs/issuing covers the Issuing overview and account eligibility
  - https://stripe.com/docs/issuing/cards/virtual/issue-cards covers cardholder fields, per-country requirements, and PAN display
  - https://stripe.com/docs/issuing/controls/spending-controls covers spending_controls structure and MCC groupings
  - https://stripe.com/docs/issuing/controls/real-time-authorizations covers real-time auth timeout, default behavior, and response shape
  - https://stripe.com/docs/issuing/webhooks covers Issuing event types and routing
  - https://stripe.com/docs/issuing/funding/overview covers funding paths (top-ups, direct bank funding, automatic from Stripe balance)
- **API Changelog:** https://stripe.com/docs/upgrades, watch for changes to Issuing webhook event names, response shape for `issuing_authorization.request`, and per-country cardholder requirements.
- **Stripe MCP hints (if connected):**
  - To check whether the connected account is eligible for Issuing and in which countries, query the account capabilities via the API reference.
  - To check current cardholder field requirements for the team's countries, query the relevant doc page.
  - To check the current Issuing balance and funding state for the connected account, query the Issuing balance endpoint.
- **What to re-verify before relying on this file:**
  - Real-time `issuing_authorization.request` timeout window and default behavior when the handler errors or times out.
  - Required fields for `individual` and `company` cardholders per country.
  - Current funding paths available to the team's account (top-ups, direct bank funding, automatic platform-balance funding).
  - Current approach for displaying full card details (ephemeral keys, client SDKs).
  - Per-country availability of Issuing and supported card networks.

## Integration Patterns

### Overall flow

1. Create a `Cardholder` for each person/entity who will receive a card (individual or company type).
2. Create a `Card` (virtual or physical) linked to the cardholder, with `spending_controls` defining what it can be used for.
3. When the card is used, Stripe sends a real-time `issuing_authorization.request` webhook (if using real-time authorizations) or processes the authorization based on the configured spending controls, the integration must respond quickly (synchronously) to approve or decline.
4. Subsequent lifecycle webhooks (`issuing_authorization.created`, `issuing_transaction.created`, etc.) inform the integration of the outcome and final transaction details.
5. The Issuing balance must be funded for authorizations to succeed, typically via a top-up from the linked bank account or from the platform's Stripe balance.

### Real-time authorizations vs. spending controls only

- **Spending controls only**: define limits (per-authorization amount, spending limits over time windows, allowed/blocked merchant categories) on the `Card` object, Stripe enforces these automatically without the integration needing to respond in real time.
- **Real-time authorizations**: the integration receives `issuing_authorization.request` and must respond within a tight timeout with approve/decline. This allows custom logic (e.g., checking an internal balance, fraud rules) beyond static spending controls. [Unverified: confirm the current timeout window against https://stripe.com/docs/issuing/controls/real-time-authorizations.]

**Recommendation pattern:** start with spending controls only for simpler use cases (predictable limits per card). Use real-time authorizations only when the approval decision genuinely depends on data that changes faster than spending controls can be updated (e.g., a real-time internal wallet balance). Real-time authorizations add a hard latency and availability requirement, since a slow or failed response results in the authorization being declined or approved by a default behavior, review with `solution-architect`.

## Code Examples

### 1. Create a cardholder (Node.js)

```javascript
const cardholder = await stripe.issuing.cardholders.create({
  type: 'individual',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone_number: '+15555550100',
  billing: {
    address: {
      line1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94111',
      country: 'US',
    },
  },
  individual: {
    first_name: 'Jane',
    last_name: 'Doe',
  },
});
```

[Unverified] Required fields for `individual`/`company` cardholder types and additional verification requirements vary by country, confirm at https://stripe.com/docs/issuing/cards/virtual/issue-cards

### 2. Create a virtual card with spending controls (Node.js)

```javascript
const card = await stripe.issuing.cards.create({
  cardholder: cardholder.id,
  currency: 'usd',
  type: 'virtual',
  spending_controls: {
    spending_limits: [
      { amount: 50000, interval: 'monthly' }, // $500.00 / month
    ],
    allowed_categories: ['restaurants', 'gas_stations'], // optional, restrict by merchant category
  },
});
```

### 3. Real-time authorization webhook (Node.js / Express)

```javascript
app.post(
  '/webhooks/stripe-issuing',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_ISSUING_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'issuing_authorization.request') {
      const auth = event.data.object;

      // Default to declining unless explicitly approved.
      // Replace with real check, e.g., internal balance lookup.
      const approved = await checkInternalBalance(auth.cardholder, auth.amount);

      return res.json({
        approve: approved,
        // optional: metadata, reason codes, etc.
      });
    }

    res.json({ received: true });
  }
);
```

Note the **default-deny** posture: if the check fails or the handler errors, the authorization should not be approved. Review this with `security-officer`.

### 4. Funding the Issuing balance

```javascript
// Funds typically arrive via a bank transfer to a Stripe-provided
// funding account, or by topping up from the Stripe balance,
// depending on account configuration.
const topup = await stripe.topups.create({
  amount: 100000, // $1,000.00
  currency: 'usd',
  description: 'Issuing balance top-up',
});
```

[Unverified] Funding flow (top-ups vs. direct bank funding instructions vs. automatic from platform balance) depends on account setup and country, confirm at https://stripe.com/docs/issuing/funding/overview

## Common Implementation Pitfalls

1. **Real-time authorization timeout handling.** If the webhook handler does not respond within Stripe's timeout, or errors, the authorization is handled according to a default behavior that may not match the team's risk tolerance. Confirm and test this default explicitly, do not assume.

2. **Default-allow logic.** A real-time authorization handler that approves on any error path (e.g., a try/catch that defaults to `approve: true`) is a direct path to fraud losses. Default to decline, per `security-officer` review criteria.

3. **Insufficient Issuing balance.** If the Issuing balance is not funded ahead of usage, authorizations will be declined regardless of spending controls. For predictable usage, set up automatic top-ups or monitoring/alerting on the Issuing balance.

4. **Spending controls vs. real-time logic drift.** If using both static spending controls and real-time authorization logic, ensure they are not contradictory (e.g., a static limit that is more permissive than what the real-time check would allow, making the real-time check redundant or confusing).

5. **Card lifecycle and replacement.** Physical cards can be lost, stolen, or expire. The integration needs a flow for cardholders to report this and for the team to deactivate the old card (`status: 'canceled'`) and issue a replacement, without losing the link to the cardholder's transaction history.

6. **PCI scope for displaying card details.** Displaying full card numbers (e.g., for a virtual card in a web/mobile app) requires special handling, typically using Stripe's `ephemeral keys` and client-side SDKs designed for this, to avoid the full PAN passing through the team's servers. Review with `compliance-officer` and `security-officer` before building a "view card details" feature. [Unverified] Confirm current approach at https://stripe.com/docs/issuing/cards/virtual/issue-cards#view-card-pan

7. **Merchant category code (MCC) restrictions being too broad or too narrow.** `allowed_categories`/`blocked_categories` use Stripe's MCC groupings, which may not map precisely to the team's intended restriction (e.g., "restaurants" may include categories the team did not anticipate). Test with realistic merchant scenarios.

## Relevant Stripe Documentation

- Issuing overview: https://stripe.com/docs/issuing
- Issue cards: https://stripe.com/docs/issuing/cards/virtual/issue-cards
- Authorization controls: https://stripe.com/docs/issuing/controls/spending-controls
- Real-time authorizations: https://stripe.com/docs/issuing/controls/real-time-authorizations
- Issuing webhooks: https://stripe.com/docs/issuing/webhooks
- Funding: https://stripe.com/docs/issuing/funding/overview
