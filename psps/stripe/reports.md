# Stripe: Reporting and Reconciliation

Covers Interchange-Plus (IC+) pricing mechanics, the Reporting API (Activity Report, Payout Reconciliation Report and others), payouts, and Stripe Sigma. Load this file once reporting, reconciliation, pricing, or finance/accounting integration becomes the active topic, this often comes up alongside `sub-agents/finance-treasury.md`.

## Verification References

Use these pointers during `/validate-context` and before generating final integration code for this product line. The product-line file below describes stable patterns; pricing model assignment, report schemas and version identifiers, processing windows, payout policies, and Sigma access tiers must be re-verified against the sources here.

- **Canonical docs:**
  - https://stripe.com/docs/reports covers Reporting API overview
  - https://stripe.com/docs/reports/report-types covers report types and current version identifiers (e.g., `activity.itemized.<version>`)
  - https://stripe.com/docs/reports/payout-reconciliation covers Payout Reconciliation column set and version
  - https://stripe.com/docs/reports/payment-fees-report covers the Payment Fees sub-reports
  - https://stripe.com/docs/reports/balance-transaction-types covers balance transaction type enumeration
  - https://stripe.com/docs/payouts covers payout schedules, supported cadences, and policy windows
  - https://stripe.com/docs/sigma covers Sigma overview and access tiers
  - https://stripe.com/docs/stripe-data/write-queries covers Sigma joins and available tables
  - https://stripe.com/docs/stripe-data/available-data covers Sigma data availability windows
- **API Changelog:** https://stripe.com/docs/upgrades, watch for new report versions, new balance transaction types, and changes to Sigma access tiers.
- **Stripe MCP hints (if connected):**
  - To check the connected account's current pricing model (IC+ vs. blended), query the account object or the relevant contract reference via the API.
  - To check the latest available report version identifiers, list the report types via the API reference.
  - To check the team's current Sigma access tier, query the connected account's Sigma capability.
- **What to re-verify before relying on this file:**
  - Whether the connected account is on IC+ or blended pricing.
  - Current Stripe fixed and variable fees in the team's contract, and any software/service fees for Connect, Radar, Sigma, Billing.
  - Current report type identifiers and column schemas for Activity, Payout Reconciliation, Balance, and Payment Fees reports.
  - Current processing-availability windows for each report (T+1, ~72 hours, etc.).
  - Current payout policy windows (e.g., the 90-day hold policy) and supported automatic-schedule cadences.
  - Current Sigma access tiers, Dashboard preview row limit, scheduled-query cadences, and join surface.

## Interchange-Plus (IC+) Pricing

Interchange-Plus (IC+, sometimes called "Cost+") is a pricing model where the merchant is billed for the actual underlying network and issuer costs, plus a separate Stripe fee, rather than a single blended rate. Understanding its components matters for reconciliation, because it changes when and how fees appear in reports. [Unverified] Confirm whether the team's account is on IC+ or blended pricing, this materially affects which of the sections below apply, with `sub-agents/finance-treasury.md` and `sub-agents/solution-architect.md` (capability check via the account, see `psps/stripe/README.md` general notes on pricing-related feature gating).

### Components

- **Interchange**: the fee paid to the card-issuing bank. Charged once per successful transaction (1:1 ratio with transactions). The applicable rate depends on factors such as: geographic region, domestic vs. cross-border (issuing country differs from the merchant's country), card-present vs. card-not-present, consumer vs. commercial/business card, standard vs. premium card tier (e.g., World Elite, Signature), and funding source (credit vs. debit).
- **Network costs**: fees paid to the card network (Visa, Mastercard, Discover, etc.). These can be incurred multiple times per transaction (1:many ratio) and cover authorization (including declined attempts), capture/settlement of successful transactions, card validations, refunds, and cross-border acquiring. American Express is billed differently, as a discount rate charged directly by Amex (1:1 ratio).
- **Stripe's own fee**: typically two parts per the contract: a **fixed fee per authorization** (covers gateway requests including failed authentications and card validations, with **no fee on refunds**), and a **variable fee** (a percentage of volume, charged **per successfully captured payment**). [Unverified] Confirm the exact fixed/variable amounts in the team's contract. Separate software/service fees apply for features such as Connect, Radar, Sigma, and Billing.

### Reporting timeline

IC+ costs are assessed on a different schedule than the payment itself, which is why **a payment always shows a Stripe fee of $0/EUR0 in the Dashboard at the time it is created (T+0)**. The actual cost data follows on a separate, generally daily, cadence (all times based on the UTC clock):

- **T+0**: the payment occurs; Cost+ fees show as zero in the Dashboard at this point.
- **T+1**: transaction-level reporting for the T+0 day's fees becomes available.
- IC+ fee balance transactions in the Dashboard can appear **up to 48 hours** after the end of the T+0 day.
- **Sigma and financial reports** (including via API) for a given day's costs generally land **up to 72 hours** after the end of that day.
- **Monthly true-ups** (end-of-month adjustments) are charged alongside the regular daily IC+ fees for the last day of the previous month, i.e., up to **48 hours after the end of the month (EOM+2)**.

In "All Transactions" / Activity views, network costs typically appear as **daily batches** (one batch per day of activity) plus a **monthly batch** for true-ups. Compare the date referenced in a fee's description against its actual processing/availability date to spot the lag, for example, fees described as relating to the 5th of the month may not be processed and visible until the 7th. **Monthly true-ups appear categorized as "network costs," not as "adjustments."** There is one balance transaction per day on which an adjustment occurred.

### Refunds and disputes: which fees are returned

| Fee component | On a refund | On a won dispute | On a lost dispute |
|---|---|---|---|
| Stripe's per-authorization (fixed) fee | Not refunded | Not refunded | Not refunded |
| Stripe's variable (volume) fee | Refunded | Refunded | Not refunded |
| Interchange | Often only partially refunded (varies by card/region; [Unverified] US-regulated debit interchange is generally not refunded) | Not refunded | Not refunded |
| Network costs | Still incurred (network costs apply even to refunds, in cases where Stripe itself is charged by the networks) | Still incurred, even though not separately passed through as a line item | Still incurred |
| Dispute fee | N/A | Refunded, but only once the dispute is **won** (not when evidence is submitted), see `psps/stripe/fraud-and-disputes.md` | Not refunded |

This table is a frequent source of "why doesn't my refund net to zero" questions from finance teams, walk through it during scoping with `sub-agents/finance-treasury.md`.

## Automated Reporting via the Reporting API

Reports are requested via `stripe.reporting.reportRuns.create` and, once ready, downloaded from the resulting `result` file. Completion is signaled by the `reporting.report_type.updated` webhook event.

```javascript
const reportRun = await stripe.reporting.reportRuns.create({
  report_type: 'balance.summary.1',
  parameters: {
    interval_start: startTimestamp,
    interval_end: endTimestamp,
  },
});
```

**Important**: the `reporting.report_type.updated` event is **not** included when a webhook endpoint is configured to receive "all events", it must be explicitly added to the endpoint's event list. An endpoint that looks correctly configured (receiving all other payment events) can silently never receive report-completion notifications.

## Activity Report

The Activity Report (`report_type: 'activity.itemized.3'` or similar) lists individual balance transactions (charges, refunds, fees, adjustments) for a period.

**Timezone gotcha**: Activity Report data is computed on **UTC day boundaries** and has roughly a **72-hour processing delay** before a given day's report is available. For a business operating in a non-UTC timezone (e.g., US Pacific), this can produce an apparent extra day of lag compared to what the finance team expects, a "yesterday" report in Pacific time may actually correspond to data from two UTC days ago. Set expectations with the finance team about this delay during scoping, it is a frequent source of "where is my data" questions.

## Payout Reconciliation Report

The Payout Reconciliation Report (`report_type: 'payout_reconciliation.by_id.itemized.<version>'`) ties balance transactions to the specific payout that paid them out, the core report for matching Stripe payouts to bank deposits.

A useful starting set of columns for this report includes:

- `automatic_payout_id` / `automatic_payout_effective_at` (the payout this transaction was included in, and when it landed)
- `balance_transaction_id`
- `balance_transaction_created_at`
- `balance_transaction_type` (charge, refund, payout, adjustment, fee, etc.)
- `customer_facing_amount` / `customer_facing_currency` (what the customer was charged, in their currency)
- `gross_amount` / `currency` (the amount in the settlement currency)
- `fee_amount` (Stripe's fee for this transaction)
- `net_amount` (gross minus fee, what actually contributed to the payout)
- `charge_id` / `payment_intent_id` (to join back to the order)
- `customer_id`
- `description`

[Unverified] The exact column names and available report versions change over time and vary by account configuration, confirm the current schema for the account's report version at https://stripe.com/docs/reports/payout-reconciliation. Treat the list above as a starting point for scoping a finance team's "what columns do you need" conversation, not a final spec.

## Financial Report Types Compared

Stripe's standard financial reports (available via the Dashboard and the Reporting API) answer different questions and are built around different date bases. Choosing the right report for a given finance question avoids a lot of back-and-forth:

| Report | Answers | Ideal for | Period basis | Processing availability |
|---|---|---|---|---|
| **Activity** | "When closing my books, what revenue and expenses should I record?" | Recording journal entries for a period of activity (accrual-basis accounting): attributing costs, including non-payment fees, to the date of the original billing/activity rather than the date Stripe debited the balance | Date of the original activity | [Unverified] within ~72 hours |
| **Balance** | "How did fees, transfers, and payments change my Stripe balance?" | Understanding day-to-day changes in the Stripe balance; treating Stripe like a bank account for reconciliation | Date the Stripe balance changed | [Unverified] within ~12 hours |
| **Payout Reconciliation** | "How does Stripe activity map to the payments landing in my bank account?" (automatic payouts only) | Payout-focused reconciliation: matching Stripe activity to bank deposits. Not suited for transaction-level, accrual-basis cost attribution | Estimated date the payout lands in the bank account | [Unverified] within ~12 hours |
| **Payment Fees** | "What were my card payment fees, in full detail?" | Deep analysis of network and interchange costs, and why costs changed over time, via three sub-reports: a summary (Stripe fees vs. network costs), an interchange-plan-level breakdown (by card type/interchange plan), and a transaction-level fee detail report | Date of the original activity | [Unverified] within ~72 hours |

Notes:

- The Payment Fees report is **not suited for reconciliation**: it does not yet include level 3 data, alternative payment method fees, or dispute fees, use the Activity report for accrual-basis accounting of those.
- Reports are requested either from the Dashboard (with scheduled email delivery) or via the API as shown above. Each report category can be downloaded individually, and a "Custom" download option lets the team pick a specific report schema.
- [Unverified] Confirm current processing-availability figures and report-type identifiers (e.g., `activity.itemized.3`, `balance_change_from_activity.itemized.3`) at https://stripe.com/docs/reports/report-types, these change as Stripe ships new report versions.

## Payouts

Payouts move funds from the Stripe balance to the team's bank account, on either an **automatic** or **manual** schedule. This choice has implications well beyond cash-flow timing:

| | Automatic | Manual |
|---|---|---|
| **Flexibility** | Daily, weekly, or monthly schedules are supported. Cannot accommodate bi-weekly, semi-monthly, or other custom cadences. | Fully custom schedules are supported, triggered via the API on specific events or at the account's discretion. |
| **Reconciliation** | Simple: Stripe can cleanly map individual transactions to the payout that included them (see Payout Reconciliation Report above). | Transaction-level detail for what is included in a given manual payout is not available in reports, it is not possible to determine which variable-amount/variable-timestamp transactions were included in a single manual payout. |
| **Compliance** | Funds are paid out as they become available, after settlement. | Without payout triggers, available funds can sit in the Stripe balance for long periods. A maximum-hold policy applies. [Unverified: confirm the current limit against https://stripe.com/docs/payouts. Recent docs have stated 90 days.] |
| **Failure handling** | If a payout fails, Stripe automatically attempts to include it in the next automatic payout. | If a payout fails, Stripe does not automatically retry, the team must implement their own retry logic using the `payout.failed` webhook. |

### Illustrative automatic payout timeline (3-business-day delay)

For an account on a 3-business-day automatic payout delay:

1. **Day 0**: a payment is created.
2. **Day 1**: between 00:00 and 11:00 UTC, Stripe groups the funds that became available on Day 0 and creates a payout for them.
3. **Day 3**: the payout is paid out and funds are expected to arrive in the bank account.

Weekend activity is typically grouped together: payments created on Saturday and Sunday are grouped into payouts created together (e.g., both processed on the following business day), and paid out together a corresponding number of business days later.

This is a `sub-agents/finance-treasury.md` decision: weigh the reconciliation simplicity and policy compliance of automatic payouts against the scheduling flexibility of manual payouts, and confirm `payout.failed` handling is implemented if manual payouts are chosen (cross-ref `psps/stripe/platform.md` webhook events for Connect, where connected accounts may have their own payout schedules).

## Stripe Sigma

For ad-hoc or custom queries beyond the standard report types, Stripe Sigma provides SQL access to the account's transaction data directly from the Dashboard. This is useful when the finance team needs a one-off analysis that does not map cleanly to `activity` or `payout_reconciliation` reports. It requires a Sigma-eligible plan.

### Key considerations

- **Account for all balance transaction types.** Queries should be designed to handle the full range of balance transaction types (charges, refunds, fees, adjustments, transfers, payouts, etc.), not just the obvious ones, to avoid silently dropping rows.
- **Design around data availability.** It takes time for data to become queryable:
  - The Dashboard shows when data was last updated; the `data_load_time` variable can be used in scheduled queries to reference the most recent available data.
  - As a rule of thumb, a full day is generally sufficient for a given day's activity to become queryable (data for a day ending at 23:59:59 UTC is generally available by around midday UTC the next day, in the account's timezone).
  - **IC+ fee data is available approximately 96 hours after the payment**, later than most other balance transaction data, queries that join payments to their IC+ fees need to account for this lag.
- **Joining tables**: Sigma supports joining across the available tables (e.g., charges, balance transactions, refunds, disputes). [Unverified] See https://stripe.com/docs/stripe-data/write-queries#joining-tables for current join patterns and available tables.
- **Saving and sharing queries**: queries can be saved and shared with team members who have report-viewing access. Shared queries are **read-only** for other members, a team member wanting to modify a shared query must save their own copy. Each saved query has a unique URL that can be bookmarked or shared directly.
- **Access/roles**: only team members with elevated access (Administrator, Developer, or Analyst, or an equivalent custom role) can create queries. The Dashboard preview is row-limited, while CSV export has no row limit. [Unverified: confirm current roles and preview row limit against https://stripe.com/docs/sigma. Recent docs have stated 1,000 rows for the preview.]
- **Scheduled queries**: can run **daily, weekly, or monthly**, and **only execute against live-mode data** (there is no scheduled-query equivalent in test mode, though queries can be run manually against test data from the Dashboard UI). Query creators are subscribed to email notifications by default; additional team members can be added as subscribers and can unsubscribe via a link in the email. Results are also available via webhook notification and API download.

### Testing a Sigma scheduled-query pipeline

Because scheduled queries only run against live data, testing the downstream pipeline (the application logic that receives and processes report files) needs a different approach, generally three steps (cross-ref `psps/stripe/testing-and-ops.md` for general webhook-testing guidance):

1. **Send a test `sigma.scheduled_query_run.created` event** to the webhook endpoint using the Dashboard's "send test event" feature, and verify the application receives the event and correctly checks its signature (https://stripe.com/docs/webhooks/signatures).
2. **Use a real file reference in a mock event**: take the "fake" event from step 1 and populate it with a real `data.object.file.id`, `data.object.file.links.url`, and `data.object.file.url` (obtained by running a query manually in the Dashboard), plus optionally `data.object.file.size` and the `api_version`. Send this to the processing logic to confirm it correctly reads the relevant fields and triggers a file download. [Unverified] Downloading a live-mode file requires a live-mode (restricted) API key.
3. **Exercise the downstream processing**: feed the previously downloaded file into the internal systems that consume report data, to confirm the file content can be correctly parsed and used downstream.

## Relevant Stripe Documentation

- Reporting API overview: https://stripe.com/docs/reports
- Report types reference: https://stripe.com/docs/reports/report-types
- Payout reconciliation: https://stripe.com/docs/reports/payout-reconciliation
- Payment Fees report: https://stripe.com/docs/reports/payment-fees-report
- Balance transaction types: https://stripe.com/docs/reports/balance-transaction-types
- Payouts: https://stripe.com/docs/payouts
- Stripe Sigma: https://stripe.com/docs/sigma
- Sigma: querying transactions: https://stripe.com/docs/stripe-data/query-transactions
- Sigma: writing queries (joins): https://stripe.com/docs/stripe-data/write-queries
- Sigma: data availability: https://stripe.com/docs/stripe-data/available-data
- Sigma: scheduling queries: https://stripe.com/docs/stripe-data/schedule-queries
- Webhook signatures: https://stripe.com/docs/webhooks/signatures
