# Payment Foundry — Changelog

Entries are organised by date (newest first) and by version. Each entry records what changed and the commit it shipped in.

---

## How to update this file

When a meaningful change is made to the engagement framework:
1. Add a dated, versioned section at the top.
2. Summarise what changed and why, with the commit hash.
3. If a GitHub release or tag is created, record the tag name and link here.

---

## 2026-06-24

### v0.3.0 — Stripe product-line expansion

Added six new Stripe product-line files and extended three existing files to cover Payment Links, Radar for Fraud Teams, a shared products-and-prices catalog, Tax, Capital, Treasury, stablecoins (cross-cutting), and the Crypto Onramp. Engagement sequence expanded from 9 to 15 steps; Specialist Sub-Agents mapping table extended with fifteen new decision rows.

New product-line files under `psps/stripe/`:

- `products-and-prices.md`: shared catalog primitives (`Product`, `Price`, `tax_code`, `tax_behavior`, `currency_options`, `lookup_key`, tiered pricing) consumed by Billing, Tax, and the API path of Payment Links.
- `tax.md`: registrations, automatic tax calculation on Invoices and Checkout/Payment Links, Customer Tax IDs and reverse charge, marketplace-facilitator handling under Connect, exports for filing.
- `capital.md`: Stripe Capital platform model (eligibility surface, offer presentation and disclosures, application redirect, automated repayment, webhooks, combined cash-flow impact). Connect-coupled.
- `treasury.md`: platform-integrator Treasury path (financial accounts, ReceivedCredits/Debits, OutboundPayments vs. OutboundTransfers, Issuing pairing, pending-vs.-final ledger model, sponsor-bank framing).
- `stablecoins.md`: canonical cross-cutting reference for the Stripe stablecoin surface (Optimized Checkout acceptance, Treasury stablecoin balances US-only, Open Issuance via Bridge), regulatory and operational framing, supported-asset volatility framing, cross-cutting patterns.
- `crypto-onramp.md`: standalone embeddable fiat-to-crypto purchase product (no-code, embeddable, headless US-preview), KYC modes including the lower-threshold $500 mode and KYC sharing private preview, custom-stablecoin delivery via Open Issuance, regulatory framing.

Extensions to existing product-line files:

- `payments.md`: Payment Links subsection (dashboard-first, then API path with and without `on_behalf_of` for Connect, webhook handling, pitfalls); Stablecoin payments via Optimized Checkout subsection.
- `fraud-and-disputes.md`: Radar for Fraud Teams advanced capabilities (advanced rule patterns, custom lists CRUD via API, Risk Insights, reviews and analytics, tier gating).
- `billing.md`: cross-references to `products-and-prices.md`, new Stablecoin subscriptions subsection, new Tax on Invoices subsection.
- `treasury.md` (also new this release): Stablecoin financial accounts subsection added as part of the stablecoin cross-cutting work.
- `issuing.md`: Spending stablecoin balances subsection (card spend funded from a Treasury stablecoin balance).

Orchestration updates:

- `psps/stripe/README.md`: six new product-line table rows, load-guidance entries, sub-agent cross-references in General notes.
- `CLAUDE.md`: engagement sequence expanded from 9 to 15 steps (Products and Prices catalog, Tax, Capital, Treasury, Stablecoin extensions, Crypto Onramp inserted at the right dependency points); Specialist Sub-Agents mapping table extended with fifteen new decision rows covering Payment Links, catalog design, Tax, Radar for Fraud Teams, Capital, Treasury, stablecoins, and Crypto Onramp; Code Examples step range updated to "3 to 13".

Tagged `v0.3.0`.

---

## 2026-06-14

### v0.2.0 — Multi-platform agent support

- Skills moved to `skills/payment-foundry/<skill>/SKILL.md`, the new single source of truth for `/start-session`, `/validate-context`, and `/wrap-up`.
- `scripts/setup-agents.sh` added: distributes `skills/payment-foundry/` into `.claude/skills/` (Claude Code), `.agents/skills/payment-foundry/` (Google Antigravity / AWS Kiro), and `.vibe/agents/payment-foundry.toml` (Mistral Vibe).
- `setup/installation-guide.md` updated with a new "Bootstrap AI Agent Frameworks" step running the setup script.
- `setup/other-agents.md` rewritten to document the shared-source architecture and per-tool notes for Antigravity, Kiro, and Vibe.
- `README.md` updated to present payment-foundry as usable from Claude Code, Google Antigravity, AWS Kiro, and Mistral Vibe.

Tagged `v0.2.0`.

---

## 2026-06-12

### v0.1.0 — Initial engagement framework

- Initial scaffold of the Engagement Manager framework: `CLAUDE.md`, `AGENTS.md`, `README.md`.
- `.claude/skills/start-session/SKILL.md`, `.claude/skills/validate-context/SKILL.md`, `.claude/skills/wrap-up/SKILL.md` added.
- `context/` populated with per-role requirements templates and `engagement-template.md`.
- `psps/stripe/` PSP reference content and `sub-agents/` specialist definitions added.
- `setup/first-session-checklist.md` added.
- (`6a3497b`)

Updated after the first end-to-end test run:

- `context/business-info.md` added: persistent company profile template, refreshed in place across engagements rather than copied per engagement.
- `context/go-live-checklist-template.md` added: per-engagement go-live checklist template, adapted at `/wrap-up`.
- `context/engagement-template.md` removed, superseded by `business-info.md` and the go-live checklist template.
- `.claude/skills/start-session/SKILL.md`, `.claude/skills/validate-context/SKILL.md`, and `.claude/skills/wrap-up/SKILL.md` updated based on first end-to-end test run.
- `CLAUDE.md`, `AGENTS.md`, `README.md`, and `setup/first-session-checklist.md` updated to reflect the revised context-routing and output structure.
- Per-role requirements files in `context/` (`backend-developer-requirements.md`, `compliance-officer-requirements.md`, etc.) updated with minor corrections.
- `psps/stripe/testing-and-ops.md` updated.
- (`f733045`)

Tagged `v0.1.0` on `f733045`.

---

## GitHub release status

`v0.3.0` tagged (2026-06-24) and pushed to `https://github.com/cmendezs/payment-foundry`.

`v0.2.0` tagged (2026-06-14) and pushed to `https://github.com/cmendezs/payment-foundry`.

`v0.1.0` tagged on `f733045` (2026-06-14) and pushed to `https://github.com/cmendezs/payment-foundry`.
