# Payment Foundry

[English](README.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Português](README.pt.md) | [Polski](README.pl.md) | [العربية](README.ar.md)

Cross-functional alignment, not just code.

---

## What This Is

Most AI coding assistants generate a PSP integration straight from a prompt: a checkout form, a webhook handler, done. The code may run, but the decisions behind it (PCI scope, fraud rules, settlement currency, retry strategy) were never actually made by the people who own them.

Payment Foundry runs a structured engagement instead. A senior-level AI agent (the Engagement Manager) guides your technical team from scoping through implementation, and along the way captures requirements from the roles that have to live with the result: Compliance, Fraud, Security, Finance, Backend, Frontend, Architecture, and the Head of Payments.

One session. Eight perspectives. One Implementation Brief your engineers can execute from.

---

## What You Get

| Capability | What it does |
|---|---|
| Structured engagement flow | Moves your team through scoping, requirements, implementation, and review in a fixed, sensible order |
| Stakeholder requirements capture | Records each role's decisions and constraints to a dedicated file as the session progresses |
| PSP-grounded code examples | Every code example is real and runnable, adapted from verified PSP reference content, never pseudocode |
| Specialist reviews | Eight sub-agents respond approve, flag, or block, with reasoning, at the decision points that matter |
| Implementation Brief | A single written deliverable covering decisions, code, open items, and anything unverified |
| Extensible to new PSPs | Add a new PSP by following the existing `psps/<name>/` structure, no changes to core instructions needed |

---

## How a Session Flows

```
/start-session
      |
      v
  Scope & Constraints  ->  Stakeholder Requirements (one role at a time)
      |
      v
  /validate-context  ->  Verify PSP reference content against authoritative sources
      |
      v
  Core Payments -> Webhooks -> Products & Prices -> Tax -> Platform -> Capital
                                        -> Terminal -> Issuing -> Treasury -> Stablecoins -> Crypto Onramp (as in scope)
      |
      v
  Specialist Reviews (approve / flag / block)
      |
      v
/wrap-up  ->  Brief + Detailed Guide + Go-Live Checklist (outputs/<engagement>/)
```

---

## Supported PSPs

| PSP | Status | Product Lines |
|---|---|---|
| Stripe | Available | Payments (incl. Payment Links), Products & Prices, Billing, Tax, Platform (Connect), Capital, Terminal, Issuing, Treasury, Stablecoins, Crypto Onramp, Fraud & Disputes (Radar), Reports |

More PSPs are planned. To request one or contribute, open an issue or pull request.

---

## Prerequisites

- One of the supported AI coding agents: Claude Code, Google Antigravity, AWS Kiro, or Mistral Vibe. See `setup/other-agents.md` for per-tool setup notes
- A supported PSP (v1: Stripe only)
- Stripe test API keys (publishable + secret)

---

## Getting Started (Four Steps)

### 1. Clone and enter the directory

```bash
git clone https://github.com/cmendezs/payment-foundry.git
cd payment-foundry
```

### 2. Set up your environment

```bash
cp .env.example .env
# Open .env and fill in your Stripe test keys
# See setup/environment-keys.md for details
```

### 3. Read the first-session checklist

Open `setup/first-session-checklist.md` and work through it before your first session. It takes about ten minutes and prevents the most common setup issues.

### 4. Launch and start your engagement

```bash
claude
```

Then in the Claude Code session:

```
/start-session
```

Using Google Antigravity, AWS Kiro, or Mistral Vibe instead? The same `/start-session`, `/validate-context`, and `/wrap-up` flow is available in each, see `setup/other-agents.md` for the equivalent launch steps and skill locations.

---

## Slash Commands

Three commands cover the full engagement lifecycle.

| Command | When to run | What it does |
|---|---|---|
| `/start-session` | Beginning of every engagement | Identifies the PSP, scopes the engagement, captures stakeholder requirements one role at a time, and proposes the implementation sequence |
| `/validate-context` | After `/start-session`, before implementation begins | Checks the PSP-specific facts in scope (status, pricing, capability gating, header strings, API versions) against the PSP's authoritative sources, and records what is verified, unverified, or blocked |
| `/wrap-up` | End of the engagement | Collects open items, documents sub-agent outcomes, and produces three artifacts under `outputs/<engagement>/`: an executive Implementation Brief, a code-heavy Detailed Implementation Guide, and a Go-Live Readiness Checklist |

Everything between `/start-session` and `/wrap-up` is handled conversationally by the Engagement Manager: implementation guidance, code examples, and specialist reviews as decisions arise.

---

## How a Session Works

A typical engagement moves through these stages in order:

1. **Scope** - Use case, tech stack, markets, currencies, timeline, team size
2. **Stakeholder requirements** - Head of Payments, Compliance, Fraud, Backend, Frontend, Architecture, Security, Finance captured conversationally and saved as reference files
3. **Context validation** - `/validate-context` checks the PSP-specific facts in scope against authoritative sources and records verified, unverified, and blocked items
4. **Core payments** - Payment Intents, Payment Element, Payment Links, confirmation handling
5. **Webhooks** - Event handling, order state reconciliation, retries
6. **Products and Prices catalog** (if Billing or Tax in scope) - Shared catalog primitives (`Product`, `Price`, `tax_code`, `tax_behavior`, `currency_options`), settled once before either consumer
7. **Tax** (if applicable) - Registrations, automatic tax on Invoices and Checkout, Tax IDs, reverse charge, marketplace facilitator under Connect
8. **Platform flows** (if applicable) - Connect, multi-party payouts, platform fees
9. **Capital** (if applicable) - Platform-offered financing, eligibility, disclosures, repayment routing
10. **In-person flows** (if applicable) - Terminal, reader management, in-person Payment Intents
11. **Card issuing** (if applicable) - Issued cards, spend controls, authorization webhooks
12. **Treasury** (if applicable) - Financial accounts, money movement, pending-vs.-final ledger, Issuing pairing
13. **Stablecoin extensions** (if applicable) - Acceptance via Optimized Checkout, Treasury stablecoin balances, Issuing card spend from stablecoin, Open Issuance via Bridge
14. **Crypto Onramp** (if applicable) - Embeddable fiat-to-crypto purchase, integration and KYC modes, Stripe as merchant of record
15. **Specialist reviews** - Each sub-agent loads its requirements file, reviews the relevant decisions, and outputs approve / flag / block with reasoning
16. **Engagement Artifacts** - Executive Implementation Brief, code-heavy Detailed Implementation Guide, and per-engagement Go-Live Readiness Checklist

The Engagement Manager proposes this sequence at the start and adapts it to what is actually in scope for your team.

---

## Specialist Sub-Agents

Eight specialists are available for cross-functional review. The Engagement Manager invokes them at the right decision points: you do not need to call them directly.

| Specialist | Reviews |
|---|---|
| Head of Payments | KPI monitoring, migration risk, operational governance |
| Compliance Officer | PCI scope, SCA/3DS2, data residency, audit trail |
| Fraud Officer | Risk rules, 3DS strategy, dispute and chargeback process |
| Security Officer | Secret management, webhook validation, fraud controls |
| Solution Architect | Integration patterns, failure modes, scalability |
| Frontend Developer | Checkout UX, error handling, accessibility, localization |
| Backend Developer | Idempotency, webhook processing, retries, reconciliation |
| Finance and Treasury | Settlement, multi-currency, payouts, reporting, tax |

Each specialist produces an outcome: **approve**, **flag** (proceed with conditions), or **block** (stop until resolved). The Engagement Manager helps you resolve flags and blocks before moving on.

---

## Directory Structure

```
payment-foundry/
├── README.md                        # You are here
├── CLAUDE.md                        # Engagement Manager instructions
├── AGENTS.md                        # Shared agent instructions pointer, read by Mistral Vibe, AWS Kiro, and other AGENTS.md-aware tools
├── .env.example                     # Copy to .env and fill in your keys
│
├── setup/                           # Run once before your first session
│   ├── installation-guide.md
│   ├── first-session-checklist.md
│   ├── environment-keys.md
│   └── other-agents.md              # Per-tool notes: Claude Code, Antigravity, Kiro, Vibe
│
├── skills/
│   └── payment-foundry/             # Source of truth for the three skills
│       ├── start-session/SKILL.md      # /start-session command
│       ├── validate-context/SKILL.md   # /validate-context command
│       └── wrap-up/SKILL.md            # /wrap-up command
│
├── scripts/
│   └── setup-agents.sh              # Distributes skills/payment-foundry/ to each tool below
│
├── .claude/skills/                  # Claude Code copy (generated by scripts/setup-agents.sh)
├── .agents/skills/payment-foundry/  # Google Antigravity / AWS Kiro copy (generated by scripts/setup-agents.sh)
├── .vibe/agents/payment-foundry.toml # Mistral Vibe subagent profile (generated by scripts/setup-agents.sh)
│
├── sub-agents/                      # Specialist reviewer definitions
│   ├── README.md                    # Invocation procedure
│   ├── head-of-payments.md
│   ├── compliance-officer.md
│   ├── fraud-officer.md
│   ├── security-officer.md
│   ├── solution-architect.md
│   ├── frontend-developer.md
│   ├── backend-developer.md
│   └── finance-treasury.md
│
├── psps/                            # PSP reference content, loaded at runtime
│   └── stripe/
│       ├── README.md                # Index: which file covers what
│       ├── payments.md              # Payment Intents, Payment Element, Payment Links
│       ├── products-and-prices.md   # Shared catalog primitives (Product, Price, tax_code, tax_behavior)
│       ├── billing.md               # Subscriptions, invoicing, customer portal, dunning
│       ├── tax.md                   # Stripe Tax: registrations, automatic tax, Tax IDs
│       ├── platform.md              # Connect: Standard / Express / Custom, transfers, payouts
│       ├── capital.md               # Stripe Capital (Connect-coupled financing for connected accounts)
│       ├── terminal.md              # In-person/point-of-sale: readers, connection tokens
│       ├── issuing.md               # Card issuing: cardholders, spending controls, authorizations
│       ├── treasury.md              # Embedded banking (financial accounts, ACH/wires, OutboundPayments)
│       ├── stablecoins.md           # Cross-cutting: Optimized Checkout acceptance, balances, Open Issuance
│       ├── crypto-onramp.md         # Embeddable fiat-to-crypto purchase (Stripe as merchant of record)
│       ├── fraud-and-disputes.md    # Radar (incl. Fraud Teams), 3DS, chargebacks
│       ├── reports.md               # Reporting API, Activity Report, Sigma
│       └── testing-and-ops.md       # Test/live mode, webhook testing, API versioning
│
├── context/                         # Scoping and requirements templates
│   ├── business-info.md              # /start-session scoping guide
│   ├── go-live-checklist-template.md # Source template for go-live checklist
│   ├── head-of-payments-requirements.md
│   ├── compliance-officer-requirements.md
│   ├── fraud-officer-requirements.md
│   ├── backend-developer-requirements.md
│   ├── frontend-developer-requirements.md
│   ├── solution-architect-requirements.md
│   ├── security-officer-requirements.md
│   └── finance-treasury-requirements.md
│
└── outputs/
    ├── <engagement>-*-requirements.md      # Captured per session, per role
    ├── <engagement>-context-validation.md  # Produced by /validate-context
    └── <engagement>/                       # Per-engagement folder, produced by /wrap-up
        ├── implementation-brief.md         # Executive layer
        ├── implementation-detailed.md      # Developer manual with code
        └── go-live-checklist.md            # Adapted from the template
```

Company information lives in `context/business-info.md` and is updated in place across engagements, never copied per engagement.

---

## Adding a New PSP

Create a folder under `psps/<name>/` with a `README.md` index and one file per product line. Follow the same structure as `psps/stripe/`. No changes are needed to `CLAUDE.md` or `sub-agents/`.

---

## License

This project is licensed under the Apache License 2.0. See the `LICENSE` file for details.
