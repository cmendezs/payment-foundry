# Company Information

This file is the source of truth for stable information about the company. It is read at the start of every `/start-session` and updated in place when something has changed or a new fact is captured. It is never copied per engagement. Per-engagement specifics (which markets, channels, or payment methods are in scope for the engagement at hand, the go-live target, the team available for that engagement) are captured in the conversation and persisted in `outputs/<short-engagement-name>/implementation-brief.md`.

Items marked `[Not yet captured]` are prompts for the Engagement Manager to ask about during `/start-session`. Replace the placeholder with the actual value once captured. Items captured in a previous session should be re-confirmed at the start of each new session in case they have changed.

## 1. Company Overview

- **Company name:** [Not yet captured]
- **Industry:** [Not yet captured]
- **Founded:** [Not yet captured]
- **Size (employees, approximate annual revenue range):** [Not yet captured]
- **Website:** [Not yet captured]
- **Primary contact for implementation work (name, role, email):** [Not yet captured]

## 2. Business Model

- **Sales channels in use** (direct e-commerce, marketplace, in-store/POS, phone/assisted, B2B invoicing, subscriptions/recurring, other)**:** [Not yet captured]
- **Third-party platforms that restrict the company's PSP choice** (e.g., Amazon, Mirakl) and which one**:** [Not yet captured]
- **Transaction types in use across the business** (one-time, deposits/pre-auth, subscriptions, split/installments, marketplace payouts, refunds, B2B deferred)**:** [Not yet captured]

## 3. Use Case Patterns

- **What is being sold or what services are being paid for:** [Not yet captured]
- **Customer types served** (consumer, business, internal user)**:** [Not yet captured]
- **Payment shapes** (one-time, recurring, both)**:** [Not yet captured]
- **Marketplace or platform element** (does money need to reach a third party)**:** [Not yet captured]
- **Card brands or networks excluded as a matter of policy, and where the exclusion is enforced** (risk rules, backend, frontend)**:** [Not yet captured]
- **Wallet account topology** (e.g., PayPal 1:1 mapping with PSP account across markets)**:** [Not yet captured]
- **Refund vs dispute policy** (can a disputed payment still be refunded, or routed to evidence submission)**:** [Not yet captured]

## 4. Current Payment Setup

- **Existing PSPs in use** (name, contract status, approximate monthly volume, channels covered, reason for change or addition)**:** [Not yet captured]
- **Approximate total monthly volume across PSPs:** [Not yet captured]
- **Data migration constraints** (historical transactions, stored cards, connected accounts)**:** [Not yet captured]
- **Payment methods currently accepted, per country:** [Not yet captured]

## 5. Volume and Geography

- **Countries where payments are collected today:** [Not yet captured]
- **Primary settlement currency:** [Not yet captured]
- **Multi-currency pricing or settlement needs, and which currencies:** [Not yet captured]
- **Legal entity locations** (drives account or entity setup)**:** [Not yet captured]
- **Typical monthly transaction volume** (count, GMV, average value)**:** [Not yet captured]
- **Peak period** (if seasonal)**:** [Not yet captured]
- **Multi-market account structure** (single global PSP account, or one per market or entity, and the driver)**:** [Not yet captured]
- **Known regulatory considerations** (SCA in EEA/UK, sector-specific)**:** [Not yet captured]

## 6. Technical Environment

- **Backend language and framework:** [Not yet captured]
- **Frontend stack** (web, mobile)**:** [Not yet captured]
- **Checkout** (custom-built, CMS or e-commerce platform with name, or no checkout yet)**:** [Not yet captured]
- **Cloud provider** (AWS, Azure, GCP, on-premise)**:** [Not yet captured]
- **Existing PSP SDK or API integrations:** [Not yet captured]
- **PCI-DSS certification** (SAQ level, in progress, or none)**:** [Not yet captured]
- **Card data storage today:** [Not yet captured]
- **CI/CD setup relevant to payment integration testing:** [Not yet captured]
- **Regulatory constraints** (GDPR, DORA, local financial regulations, sector-specific)**:** [Not yet captured]

## 7. PSP Preferences and Target Payment Methods

- **PSPs in use or selected across the organization:** [Not yet captured]
- **Top selection criteria when evaluating a PSP** (pricing, payment method coverage, geographic reach, developer experience, fraud tools, reporting, support SLA)**:** [Not yet captured]
- **Payment methods the company wants to accept across markets, with target countries and priority** (High, Medium, Low)**:** [Not yet captured]
- **Payment methods customers have explicitly requested that are not yet supported:** [Not yet captured]

## 8. Team and Stakeholders

- **Compliance and legal contact:** [Not yet captured]
- **Infrastructure and deployment owner:** [Not yet captured]
- **Frontend and checkout owner:** [Not yet captured]
- **Backend development lead:** [Not yet captured]
- **Fraud and risk operations:** [Not yet captured]
- **Finance and treasury lead:** [Not yet captured]
- **Security officer or CISO:** [Not yet captured]
- **Solution architect:** [Not yet captured]

## Maintenance

- The EM updates this file in place during `/start-session`. It is never copied to `outputs/`.
- When in doubt about a fact, ask. Do not invent.
- When a fact changes (new market added, PSP swapped, contact replaced), update the relevant line during the next session.
- Per-engagement scope (which markets, channels, or payment methods are in scope for this engagement, go-live target, internal team allocated) belongs in the engagement's Implementation Brief, not in this file.
