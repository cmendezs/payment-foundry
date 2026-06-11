# Stripe: Fraud, 3D Secure, and Disputes

Covers Radar (Stripe's fraud detection and prevention tooling), 3D Secure 2 enforcement, and the dispute lifecycle. Builds on the core flow in `psps/stripe/payments.md`, load this file once fraud rules, authentication enforcement, or dispute handling become the active topic.

## Verification References

Use these pointers during `/validate-context` and before generating final integration code for this product line. The product-line file below describes stable patterns; Radar rule grammar and limits, SCA exemption thresholds, dispute fees and timelines, and card-network monitoring thresholds change over time and must be re-verified against the sources here.

- **Canonical docs:**
  - https://stripe.com/docs/radar covers Radar overview and risk levels
  - https://stripe.com/docs/radar/rules/reference covers Radar rule field names, operators, and per-account limits
  - https://stripe.com/docs/radar/analytics covers Radar reporting used to track fraud and dispute rates
  - https://stripe.com/docs/radar/reviews covers the review workflow
  - https://stripe.com/docs/payments/3d-secure covers 3DS request behavior, automatic version selection, and challenge display
  - https://stripe.com/docs/strong-customer-authentication covers SCA scope and exemptions
  - https://stripe.com/docs/disputes covers dispute lifecycle, fee, and timing
  - https://stripe.com/docs/disputes/responding covers evidence submission fields and deadlines
- **API Changelog:** https://stripe.com/docs/upgrades, watch for changes to Radar rule grammar, 3DS request parameter names, and dispute webhook event shape.
- **Stripe MCP hints (if connected):**
  - To check the current per-account Radar rules and rule count, list `radar.rules` for the connected account.
  - To check the connected account's dispute fee schedule, retrieve the account's pricing details via the API reference where exposed.
  - To check the current grammar of supported Radar fields and operators, query the rules reference doc.
- **What to re-verify before relying on this file:**
  - Current Radar field names, operators, and the per-account rule limit.
  - Current SCA exemption thresholds (low-value transaction limit, cumulative-spend rules) and any "one-leg out" issuer behavior.
  - Current dispute fee amount per market and the response window for submitting evidence.
  - Typical end-to-end dispute resolution time from creation to outcome.
  - Current card-network monitoring program thresholds (Visa VFMP/VDMP, Mastercard CMM, equivalents on other networks). Confirm via the team's Stripe account team or current network documentation.
  - 3DS request parameter names and current values for `payment_method_options.card.request_three_d_secure`.

## Fraud Prevention Best Practices

Two broad levers reduce fraud and disputes before Radar rules and 3DS even come into play:

### Collect customer signals without adding friction

Collecting more signal about the customer and order improves both Stripe's machine-learning model and any custom Radar rules, ideally without adding visible friction to checkout:

- **CVC and postal code**: collect both, this enables CVC-check Radar rules (see below) and is one of the strongest low-friction signals.
- **Customer identity**: name, email, billing address, shipping address. Save these on the Stripe `Customer` object, this also helps deter card testers (a fraudster testing many stolen card numbers against the same identity fields stands out).
- **Device/session signals**: IP address, user agent, redirect URL, captured automatically by Stripe.js/Elements and used by Radar's ML model.
- **Order-flow signals**: a clear return policy, estimated delivery date, and terms of use, displayed at checkout, are themselves weak fraud deterrents and also reduce "friendly fraud" disputes (see Disputes below).

### Clear customer communication

Clear, recognizable communication is one of the most effective dispute-reduction levers, because many disputes happen simply because the cardholder did not recognize the charge:

- **Statement descriptors**: make sure the descriptor matches a name the customer will recognize (see `psps/stripe/payments.md` Statement Descriptors subsection).
- **Receipts**: send a receipt for every payment.
- **Delivery date and customer service contact**: set expectations and give the customer an obvious way to resolve issues with the business directly, before they go to their bank.
- **Reasonable policies**: a clear, fair refund/cancellation policy reduces the incentive to dispute instead of asking for a refund.
- **Notice of upcoming payments**: for recurring billing, notify customers ahead of renewal charges (see `psps/stripe/billing.md`), an unexpected renewal charge is a common dispute trigger.

### Refund suspicious payments proactively

If the team identifies a suspicious or likely-fraudulent payment before the cardholder disputes it, refund it and mark it as fraudulent. This both resolves the situation for the genuine cardholder and feeds Stripe's default block list (see Lists below).

## Radar: Fraud Detection and Prevention

Radar is Stripe's built-in fraud-scoring system. It ingests hundreds of signals (card type, time of day, distance between card and IP address, browsing behavior, proxy usage, prior declines on the card, number of countries linked to the card, email-to-cardholder-name matching, and more) into a machine-learning model trained across Stripe's global transaction data, then assigns each payment a risk score and routes it accordingly.

### Risk levels

Radar assigns one of three risk levels to a payment:

- **Highest**: automatically blocked as fraudulent.
- **Elevated**: flagged, but the payment is still processed (sent for review rather than blocked outright).
- **Normal**: processed normally.

The risk score threshold that separates these levels can be tuned to the business's risk tolerance: a lower threshold for "block" catches more fraud but also more false positives (legitimate customers blocked); a higher threshold lets more through. Note that even payments Radar allows can still be declined by the issuing bank or blocked by custom rules.

### Rule evaluation order

Every payment is evaluated against the account's custom rules in a fixed order, across four rule types:

1. **3DS request rules**: when used with the Payment Intents API or Checkout, request 3D Secure authentication. Regardless of whether this rule matches, Allow/Block/Review rules are still evaluated afterward.
2. **Allow rules**: let a payment through. **Use sparingly**, an Allow rule overrides everything else, including Stripe's ML model and all other custom rules (except 3DS request rules).
3. **Block rules**: reject the payment outright. A blocked payment is not evaluated against Review rules.
4. **Review rules**: the payment is still processed and the customer is charged, but it is flagged for manual review.

### Rule language basics

Rules combine an **action** and a **condition**: `{action} if {condition}`. The condition can use standard attributes or custom metadata, combined with `AND`, `OR`, `NOT`, and operators like `IN` (e.g., `:card_country: IN ('gb', 'ie')`) and `INCLUDES` (substring match, e.g., `:ip_address: INCLUDES '192.168'`).

A narrower rule produces fewer false positives. For example, a business wanting to review prepaid cards:

```
# Too broad, generates excessive reviews
Review if :card_funding: = 'prepaid'

# Better: narrows to a higher-confidence combination
Review if :is_disposable_email: and :card_funding: = 'prepaid'
```

### Common rule patterns

**Card testing defense** (a fraudster making many small attempts to find a working stolen card):

```
Block if :charge_attempts_per_ip_address_hourly: > 1
Block if :charge_attempts_per_card_number_hourly: > 1
```

More aggressive variants block all further attempts from an IP/card after the first block:

```
Block if :blocks_per_ip_address_hourly: > 1
Block if :blocks_per_card_number_hourly: > 1
```

**CVC-check failures** (requires collecting CVC at checkout):

```
Block if :cvc_check: = 'fail'
```

**Trial/prepaid abuse** (e.g., free trials abused with prepaid cards that can't be charged later):

```
Block if :card_funding: = 'prepaid' OR :card_funding: = 'unknown'
```

### Limits and access

- A per-account rule limit applies. [Unverified: confirm current limit against https://stripe.com/docs/radar/rules/reference. Recent docs have stated 50.]
- By default, only the **account owner and admins** can create rules, check team permissions if other roles need this access.
- Stripe recommends not over-relying on custom rules and instead leaning on the ML model for most fraud detection, adding the default CVC-check rule is commonly recommended as a baseline.
- Preview a new rule's impact against historical data before enabling it, to validate it catches the intended fraud pattern without excessive false positives.

[Unverified] Confirm the exact field names, operators, and current limits against the Radar rules reference, as the expression language has evolved over time: https://stripe.com/docs/radar/rules/reference

### Lists

Lists make rules more concise by referencing a maintained set of values (e.g., `Block if :email: IN @blocked_emails`) instead of long `OR` chains. Stripe provides **default lists** (e.g., a default block list for card fingerprints/emails), and accounts can also create **custom lists**.

Refunding a charge and marking the reason as "fraudulent" automatically adds the associated card fingerprint and email to the default block list, this is one reason proactively refunding suspicious payments (see Fraud Prevention Best Practices above) is valuable beyond the individual transaction.

### Radar vs. Radar for Fraud Teams

| | Radar | Radar for Fraud Teams |
|---|---|---|
| ML-based risk scoring and automatic blocking of high-risk payments | Yes | Yes |
| Risk score visibility with key risk signals | Yes | Yes |
| Custom rules | Yes | Yes |
| Manual review queue | Limited | Full review workflow: approve, refund, or refund-and-mark-fraudulent |
| Linked-payment investigation (shared IP, card, or customer across payments) | No | Yes |
| Notes and audit trail on payments | No | Yes |
| Fraud analytics dashboards (executive summary, dispute rates/reasons, review effectiveness) | Limited | Yes |

Radar for Fraud Teams is the right fit when a business is standing up a dedicated fraud-operations function that needs investigation tooling and team-level reporting, not just automated blocking. This is a scoping decision for `sub-agents/fraud-officer.md`.

### Writing Radar Rules (additional examples)

**Block a specific card brand or network.** For example, to exclude American Express:

```
Block if :card_brand: = 'amex'
```

This is one of three layers needed to reliably exclude a brand, see pitfall 11 in `psps/stripe/payments.md`: combine a Radar rule like this with a server-side check on `paymentMethod.card.brand` before confirming, and a frontend check on the Element's `change` event for a faster user-facing error. The Radar rule and server-side check are the layers that actually prevent the payment, the frontend check is just UX.

**Enforce 3D Secure based on liability shift.** To require that every card payment either completed 3DS or is blocked:

```
Block if !(:is_3d_secure:) or !(:is_3d_secure_authenticated:) or !(:has_liability_shift:)
```

### Handling Radar Reviews

When Radar flags a payment for manual review (rather than blocking outright), the PaymentIntent can still succeed while a `review` object remains open. Two webhook events matter here:

- `review.opened`: a payment has been flagged for manual review. The associated PaymentIntent may already be `succeeded`.
- `review.closed`: the review has been resolved, either approved or, if Radar's assessment changes, the charge may later be refunded/disputed.

A useful safeguard before fulfilling an order: after receiving `payment_intent.succeeded`, retrieve the PaymentIntent with the review expanded and check whether a review is still open before releasing the order for fulfillment.

```javascript
const paymentIntent = await stripe.paymentIntents.retrieve(
  paymentIntentId,
  { expand: ['review'] }
);

if (paymentIntent.review && paymentIntent.review.open) {
  // Hold fulfillment until review.closed is received for this review
} else {
  // Safe to proceed with fulfillment
}
```

This avoids shipping an order that Radar is still actively assessing as potentially fraudulent.

## 3D Secure 2 (SCA)

### PSD2 scope

Strong Customer Authentication (SCA), under PSD2, applies to **customer-initiated payments** (most card payments and credit transfers) where **both the issuer and the acquirer are located in the EEA** (the "two-leg" rule). [Unverified] A small fraction of EU issuers may apply SCA more broadly, even when the acquirer is outside the EEA ("one-leg out"), confirm current issuer behavior is not something to design around precisely, but be aware some authentication challenges may appear even for nominally out-of-scope transactions.

Other markets have their own SCA-like requirements (e.g., India introduced mandatory two-factor authentication for online payments in 2014), confirm requirements for each market in scope with `sub-agents/compliance-officer.md`.

### Exemptions

Several categories of payment can be **exempted** from SCA, meaning authentication is not required even though the transaction is technically in scope:

- **Low transaction value** (reported threshold: under EUR 30, [Unverified] cumulative-spend rules also apply and should be confirmed).
- **Transaction Risk Analysis (TRA)**: the acquirer or issuer assesses the transaction as low-risk based on real-time risk analysis.
- **Recurring payments / merchant-initiated transactions (MIT)**: subsequent payments in a recurring series, after an initial authenticated payment.
- **Corporate cards**: payments made with corporate card products under certain conditions.
- **Trusted beneficiaries**: merchants the cardholder has explicitly whitelisted with their bank.

**Out of scope for SCA entirely** (not exemptions, simply not covered): merchant-initiated transactions (MIT) in general, and MOTO (mail order/telephone order) payments.

Stripe's dynamic 3DS / SCA exemption engine attempts to apply eligible exemptions automatically where possible. However, **issuers can still override an exemption request and require authentication anyway**, exemptions improve conversion on average but are not guaranteed. Choosing how aggressively to rely on exemptions versus forcing 3DS is a tradeoff between conversion and false-decline risk, review with `sub-agents/compliance-officer.md` (regulatory correctness) and `sub-agents/fraud-officer.md` (false-decline vs. fraud-risk tradeoff).

### Stripe's 3DS implementation notes

- **Automatic version selection**: Stripe automatically routes each transaction through 3DS1 or 3DS2 depending on what the issuer supports and what performs best for that card brand/issuer combination.
- **Issuer outage detection**: Stripe detects when an issuer's authentication page is degraded (the customer reaches the page but cannot complete authentication) and can bypass 3DS for that issuer, allowing the payment through or prompting the customer to retry with a different card.
- **Dynamic 3DS via Radar**: 3DS can be requested only for higher-risk transactions using custom Radar rules (3DS request rules, see Radar section above) or via the API, rather than requesting it on every transaction.

### Programmatic control (custom flows)

The Payment Element / `confirmPayment` flow (see `psps/stripe/payments.md`) handles 3DS automatically as part of confirmation, this subsection applies mainly to custom flows or teams that want to force 3DS even when not strictly required.

- **Programmatic enforcement**: pass `payment_method_options.card.request_three_d_secure` on the PaymentIntent. Common values are `automatic` (Stripe decides based on regulation and risk) and `any` (request 3DS on every attempt, regardless of whether it is required).
- **Display options**: when a custom flow needs to present the 3DS challenge itself (rather than relying on `confirmPayment`'s built-in handling), the challenge can be shown as a modal, a full-page redirect, or an iframe, depending on the issuer's ACS response. [Unverified] Confirm current display options and required frontend handling at https://stripe.com/docs/payments/3d-secure

## Disputes

A dispute (chargeback) occurs when a cardholder contacts their card-issuing bank to contest a charge, bypassing the merchant's refund process, typically because the cardholder does not recognize or authorize the payment.

### Lifecycle and financial timeline

1. **Customer disputes the payment** with their issuing bank.
2. **Stripe creates a dispute object.** A **dispute fee is debited from the Stripe balance immediately** (illustrative figure: around EUR 15 in some markets, [Unverified] confirm the current fee for the team's account).
3. **The business reviews the payment** and decides:
   - **If the dispute looks valid** (e.g., genuinely fraudulent), accept the dispute. The disputed amount is debited from the Stripe balance and refunded to the customer; the dispute fee is not recredited. In parallel, the business can still try to get the customer to withdraw the dispute directly.
   - **If the business believes the dispute is not legitimate**, submit evidence (proof of delivery, customer communications, refund policy, etc.) via the Dashboard's guided evidence workflow or `stripe.disputes.update` with the `evidence` parameter. [Unverified: confirm the current response window against https://stripe.com/docs/disputes/responding. Recent docs have stated 7-21 days depending on dispute type.]
4. **The issuing bank reviews the evidence and decides** (Stripe does not adjudicate disputes):
   - **Won**: the disputed amount and the dispute fee are both recredited to the Stripe balance.
   - **Lost**: the disputed amount remains debited; the dispute fee is not returned.
   - **No evidence submitted within the window**: the dispute expires and is treated as lost.
5. **Total resolution time** runs from creation to final outcome. [Unverified: confirm the current typical end-to-end window against https://stripe.com/docs/disputes. Recent docs have stated roughly 60-75 days.]

### Practical guidance for evidence submission

- Only respond to disputes where the business has convincing evidence, weak evidence submitted in bulk can bias human reviewers against future submissions from the same merchant.
- Even if the customer agrees to withdraw the dispute, still submit evidence, a withdrawal does not always prevent the dispute from being recorded against the account's dispute rate.
- For low-value disputes, consider accepting them below a chosen threshold rather than contesting, to reduce operational overhead, this is a `sub-agents/finance-treasury.md` and `sub-agents/fraud-officer.md` tradeoff (cost of accepted disputes vs. cost of dispute-handling effort and dispute-rate impact).

### General notes

- Disputes are visible both via the API (`charge.dispute`, the `charge.dispute.created`/`updated`/`closed` webhook events) and in the Dashboard.
- **A formally disputed payment generally cannot be refunded** while the dispute is open, refunding does not resolve a dispute and the two processes are independent. Clarify this with the team early: their support process should route disputed payments to evidence submission, not to the normal refund flow.

[Unverified] Confirm the current dispute fee amount, evidence fields, and response deadlines at https://stripe.com/docs/disputes

## Card Network Monitoring Programs

Card networks run fraud and dispute monitoring programs that track a merchant's fraud rate and dispute (chargeback) rate, and can impose additional fees or processing restrictions if thresholds are exceeded. Examples reported in past engagements (illustrative, **all thresholds are `[Unverified]` and change over time**, confirm current values via the team's Stripe account team or current network documentation):

| Program | Signal | Illustrative threshold | Period |
|---|---|---|---|
| Visa Fraud Monitoring Program (VFMP), early warning | Fraudulent payment volume on the network | > $50,000 | Monthly |
| Visa Fraud Monitoring Program - 3DS (US only), early warning | Fraud rate on the network | > 0.65% | Monthly |
| Visa Dispute Monitoring Program (VDMP), early warning | Total disputed payment count on the network | > 75 | Monthly |
| Mastercard Chargeback-Monitored Merchant (CMM), first threshold | Disputed payment count / dispute rate | > 100 disputes, or dispute rate > 1% | Monthly |

Fraud rate is generally calculated as the percentage of all payments in a given month that were fraudulent, based on a combination of fraudulent chargebacks and other early-warning fraud data. Sustained breaches of these thresholds can lead to escalating fees and, ultimately, a risk to the merchant's ability to keep processing on that network.

Track these metrics via Radar's reporting (`https://stripe.com/docs/radar/analytics`) as part of ongoing operations, this is a `sub-agents/fraud-officer.md` (rule design to stay under thresholds) and `sub-agents/finance-treasury.md` (cost impact if thresholds are breached) collaboration point.

## Relevant Stripe Documentation

- Radar overview: https://stripe.com/docs/radar
- Radar rules reference: https://stripe.com/docs/radar/rules/reference
- Radar analytics: https://stripe.com/docs/radar/analytics
- Reviews: https://stripe.com/docs/radar/reviews
- 3D Secure: https://stripe.com/docs/payments/3d-secure
- Strong Customer Authentication (SCA): https://stripe.com/docs/strong-customer-authentication
- Disputes: https://stripe.com/docs/disputes
- Responding to disputes: https://stripe.com/docs/disputes/responding
- Statement descriptors: see `psps/stripe/payments.md`
