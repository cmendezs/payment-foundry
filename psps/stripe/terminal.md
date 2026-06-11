# Stripe: Terminal

Covers Stripe Terminal: reader setup, connection tokens, in-person Payment Intents, and offline mode considerations. Relevant for any in-person/card-present payment flow (retail, restaurants, pop-up events).

This file assumes the base flow in [`payments.md`](payments.md) is understood, Terminal still uses PaymentIntents, with `card_present` as the payment method type and an in-person capture flow.

## Verification References

Use these pointers during `/validate-context` and before generating final integration code for this product line. The product-line file below describes stable patterns; reader models, SDK surface, regional availability, and offline-mode behavior must be re-verified against the sources here.

- **Canonical docs:**
  - https://stripe.com/docs/terminal covers the Terminal overview and integration paths
  - https://stripe.com/docs/terminal/readers covers currently available reader models and per-country availability
  - https://stripe.com/docs/terminal/payments/collect-payment covers SDK methods per platform (JS, iOS, Android, React Native)
  - https://stripe.com/docs/terminal/sdk-tokens covers connection token lifecycle
  - https://stripe.com/docs/terminal/features/offline-payments covers offline mode availability and behavior
  - https://stripe.com/docs/terminal/fleet/locations covers Location object and reader registration
- **API Changelog:** https://stripe.com/docs/upgrades, watch for changes to Terminal SDK method names, reader fleet, and Tap to Pay platform support.
- **Stripe MCP hints (if connected):**
  - To check the current SDK surface for the team's platform (JS, iOS, Android, React Native), query the API reference per platform.
  - To check whether a reader model is available in the team's country, query the relevant doc page.
  - To check the team's existing Locations and reader registrations, list `terminal.locations` and `terminal.readers` for the connected account.
- **What to re-verify before relying on this file:**
  - Reader models currently available and where (regional availability shifts).
  - Tap to Pay platform support (iOS, Android) for the team's target devices.
  - Exact SDK method names for the team's platform (the JS surface used in examples is illustrative).
  - Offline mode availability for the specific reader model and the current behavior on reconnect.
  - Authorization-hold window for card-present transactions on the team's relevant networks.

## Integration Patterns

### Overall flow

1. A backend endpoint generates a **connection token** (short-lived, used by the client SDK to connect to a reader).
2. The client app (mobile SDK, or a browser via Stripe Terminal JS SDK with a smart reader) discovers and connects to a physical **reader**.
3. The backend creates a `PaymentIntent` with `payment_method_types: ['card_present']` and `capture_method: 'manual'` or `'automatic'` depending on whether the team needs a separate capture step (e.g., to add a tip after the card is presented).
4. The client SDK collects payment from the reader (`collectPaymentMethod` / equivalent) and confirms the PaymentIntent on the reader.
5. The backend (or client, depending on capture method) captures the PaymentIntent if using manual capture.
6. Webhooks (`payment_intent.succeeded`, etc.) confirm the final outcome, same as online payments.

### Reader types

- **Smart readers** (e.g., WisePOS E, Stripe Reader S700): standalone Android-based devices, can run a full point-of-sale app.
- **Mobile readers** (e.g., BBPOS, Stripe Reader M2): connect via Bluetooth to a phone/tablet running the team's app with the Terminal SDK.
- **Tap to Pay**: uses the phone's own NFC hardware (iPhone or Android), no external reader needed, for businesses wanting the lowest-friction setup.

[Unverified] Confirm currently available reader models and regional availability at https://stripe.com/docs/terminal/readers, this changes over time and varies by country.

## Code Examples

### 1. Create a connection token (server-side, Node.js)

```javascript
app.post('/connection-token', async (req, res) => {
  const connectionToken = await stripe.terminal.connectionTokens.create();
  res.json({ secret: connectionToken.secret });
});
```

The client SDK calls this endpoint each time it needs to connect to a reader.

### 2. Create a PaymentIntent for an in-person payment (server-side, Node.js)

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2500, // $25.00
  currency: 'usd',
  payment_method_types: ['card_present'],
  capture_method: 'manual', // use 'automatic' if no separate capture step is needed
  metadata: { orderId, locationId: terminalLocationId },
}, {
  idempotencyKey: `pi_create_${orderId}`,
});

res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
```

### 3. Client-side flow (conceptual, JS Terminal SDK)

```javascript
// Discover and connect to a reader (once per session/device)
const discoverResult = await terminal.discoverReaders();
const reader = discoverResult.discoveredReaders[0];
await terminal.connectReader(reader);

// Collect payment using the PaymentIntent's client secret from the server
const collectResult = await terminal.collectPaymentMethod(clientSecret);
if (collectResult.error) {
  // handle error (e.g., card declined, reader timeout)
} else {
  const confirmResult = await terminal.processPayment(collectResult.paymentIntent);
  // confirmResult.paymentIntent.status will be 'requires_capture' if capture_method is 'manual'
}
```

[Unverified] Exact method names and SDK surface vary by platform (JS, iOS, Android, React Native) and have changed across SDK versions, confirm against https://stripe.com/docs/terminal/payments/collect-payment for the team's specific platform.

### 4. Capture the payment (server-side, if using manual capture)

```javascript
app.post('/capture-payment', async (req, res) => {
  const { paymentIntentId, amountToCapture } = req.body; // amountToCapture optional, e.g., to add a tip

  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, {
    amount_to_capture: amountToCapture, // omit to capture the full authorized amount
  });

  res.json({ status: paymentIntent.status });
});
```

## Common Implementation Pitfalls

1. **Forgetting `payment_method_types: ['card_present']`.** A PaymentIntent created without this will not work with a physical reader, the reader expects a `card_present`-compatible PaymentIntent.

2. **Connection token lifecycle.** Connection tokens are short-lived and single-use for connecting. The client needs to fetch a new one each time it connects (or reconnects) to a reader, do not cache and reuse.

3. **Manual capture and authorization holds.** If using `capture_method: 'manual'` (e.g., to add a tip), be aware that authorization holds have a time limit, an uncaptured PaymentIntent past that window may need to be re-authorized. Build in a process to capture promptly. [Unverified: confirm the current default hold window against https://stripe.com/docs/payments/extended-authorization. Recent docs have stated around 7 days, varying by network.]

4. **Offline mode assumptions.** Some smart readers support offline payment collection (storing the transaction locally and forwarding it when connectivity returns). This has implications: the payment is not confirmed in real time, and the team's order/fulfillment flow needs to handle a delayed confirmation. Do not assume real-time confirmation if offline mode is enabled. [Unverified] Confirm offline mode availability and behavior for the specific reader model at https://stripe.com/docs/terminal/features/offline-payments

5. **Reader location and inventory management.** Readers are registered to a `Location` object in Stripe. For multi-location businesses, ensure readers are correctly associated with their physical location, this affects reporting and can affect which connection tokens work with which readers.

6. **Tipping flows.** If tipping is in scope, decide whether the tip is collected on the reader itself (Stripe's tipping configuration) before confirmation, or added afterward via the capture amount. These have different UX and reconciliation implications, review with `frontend-developer` and `finance-treasury`.

7. **Network connectivity for card-present transactions.** Card-present transactions still require the reader (or the connected device) to reach Stripe's servers (except in offline mode, see above). Venues with poor connectivity should plan for this explicitly, review with `solution-architect`.

## Relevant Stripe Documentation

- Terminal overview: https://stripe.com/docs/terminal
- Readers: https://stripe.com/docs/terminal/readers
- Collecting payments: https://stripe.com/docs/terminal/payments/collect-payment
- Connection tokens: https://stripe.com/docs/terminal/sdk-tokens
- Offline mode: https://stripe.com/docs/terminal/features/offline-payments
- Terminal locations: https://stripe.com/docs/terminal/fleet/locations
