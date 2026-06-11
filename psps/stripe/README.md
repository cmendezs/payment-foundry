# Stripe

Index of Stripe reference material for the Engagement Manager. The presence of this file signals that Stripe is a supported PSP in this workspace.

## Product lines

| File | Covers |
|---|---|
| [`payments.md`](payments.md) | Payment Intents, Payment Methods, Charges, Refunds, Webhooks. The core flow for accepting a payment. |
| [`platform.md`](platform.md) | Stripe Connect (Standard, Express, Custom accounts), transfers, payouts, platform fees. For marketplaces and platforms paying out to other parties. |
| [`terminal.md`](terminal.md) | Reader setup, connection tokens, in-person Payment Intents, offline mode. For physical point-of-sale. |
| [`issuing.md`](issuing.md) | Cardholder and card creation, spending controls, authorization webhooks, funding. For issuing cards to users. |
| [`fraud-and-disputes.md`](fraud-and-disputes.md) | Radar fraud rules, 3D Secure enforcement, manual review handling, disputes/chargebacks. |
| [`reports.md`](reports.md) | Reporting API, Activity Report, Payout Reconciliation Report, IC+ pricing, payouts, Stripe Sigma. |
| [`billing.md`](billing.md) | Subscriptions, invoicing, pricing models (per-seat, usage-based), customer portal, dunning. For recurring billing. |
| [`testing-and-ops.md`](testing-and-ops.md) | Test/live mode practices, test data, webhook testing, load testing, error handling and rate limits, API versioning, support model. |

## When to load which file

- Almost every engagement needs `payments.md`, it covers the base payment flow that other product lines build on.
- Load `platform.md` if the team's use case involves a marketplace, platform, or any scenario where money needs to move to a third party (not just the business itself).
- Load `terminal.md` if any part of the use case involves in-person/card-present payments.
- Load `issuing.md` if the team needs to issue cards (virtual or physical) to users, employees, or customers.
- Load `fraud-and-disputes.md` when fraud rules, authentication (3DS) enforcement, or dispute handling become the active topic, this often pairs with the `fraud-officer` and `security-officer` sub-agents.
- Load `reports.md` when reporting, reconciliation, or finance/accounting integration becomes the active topic, this often pairs with the `finance-treasury` sub-agent.
- Load `billing.md` if the use case involves subscriptions, recurring billing, or usage-based pricing. If in scope, Billing typically slots in as its own step alongside or after core payments in the engagement sequence.
- Load `testing-and-ops.md` when the team is setting up their test environment, preparing for go-live, or troubleshooting API errors/rate limits, this often pairs with the `solution-architect` sub-agent.

A single engagement can span multiple product lines (e.g., a marketplace platform using both `payments.md` and `platform.md`). Load each relevant file as the engagement reaches that part of the sequence, do not load everything upfront.

## General notes

- All code examples in these files use Stripe's officially documented API patterns. Anything not certain is marked `[Unverified]` with a pointer to the relevant `stripe.com/docs` section, confirm against current docs before relying on it.
- Examples are shown primarily in Node.js (using the `stripe` npm package) with notes for other languages where the pattern differs meaningfully. Adapt to the team's actual stack, the underlying API calls and object model are the same across SDKs.
- Several product-line files flag specific decisions where a specialist sub-agent should weigh in (cross-referenced inline at the relevant section). Recurring examples: multi-capture/extended-authorization choice (`payments.md` -> `solution-architect`, `fraud-officer`), unified vs. regional account structure (`platform.md` -> `solution-architect`, `finance-treasury`), SCA exemption strategy (`fraud-and-disputes.md` -> `compliance-officer`, `fraud-officer`), card network monitoring program thresholds (`fraud-and-disputes.md` -> `fraud-officer`, `finance-treasury`), IC+ pricing eligibility (`reports.md` -> `finance-treasury`, `solution-architect`), billing migration (`billing.md` -> `backend-developer`, `finance-treasury`), and test clocks/`stripe-mock` adoption for CI (`testing-and-ops.md` -> `backend-developer`, `solution-architect`).

## Freshness and Verification

Each product-line file opens with a standard "Verification References" block. That block lists the canonical Stripe documentation URLs, the Stripe API Changelog, Stripe MCP query hints (when the MCP is connected), and the volatile items the team must re-verify before relying on the file (GA/beta status, header requirements, account-level capability gating, API version assumptions).

The `/validate-context` skill reads only those blocks and produces `outputs/<engagement>-context-validation.md` with `[Verified]`, `[Unverified]`, and `[Blocker]` items. Run it once per engagement, after `/start-session` and before the first implementation step. The validation output is consumed by `/wrap-up` and by each sub-agent at review time.

Where the team has connected the Stripe MCP server (see `setup/installation-guide.md`), `/validate-context` uses it to query the live API reference, the API Changelog, and the connected test account's actual capabilities. Where the MCP is not connected, `/validate-context` falls back to `WebFetch` against the canonical URLs declared in each Verification References block.
