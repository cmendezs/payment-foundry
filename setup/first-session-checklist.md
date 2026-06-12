# First Session Checklist

Go through this before running `/start-session` for a new engagement. This is a human preparation checklist, not instructions for the EM.

---

## Access and accounts

- [ ] You have a Stripe account with sandbox access (or the equivalent for your PSP)
- [ ] `.env` is created from `.env.example` and filled in with test keys (see `setup/environment-keys.md`)
- [ ] If testing webhooks locally, the Stripe CLI is installed and `stripe listen` works

---

## Context to have ready

The EM will ask all of these conversationally during your first `/start-session`, populating `context/business-info.md`. On subsequent sessions the EM only confirms what has changed and fills in any items still marked `[Not yet captured]`. Having answers ready for the first session speeds things up.

- [ ] Company overview: name, industry, size, primary contact
- [ ] Business model and sales channels: which channels are in scope, transaction types (one-time, deposits, subscriptions, refunds, etc.)
- [ ] Use case detail: what is being sold, customer type (consumer/business), one-time vs recurring, marketplace element
- [ ] Current payment setup: existing PSP(s), monthly volume, payment methods accepted today, data migration needs
- [ ] Volume and geography: countries in scope, currencies, settlement currency, legal entity location, multi-market structure (one account vs many)
- [ ] Technical environment: backend language/framework, frontend stack, mobile if applicable, cloud provider, PCI-DSS status, regulatory constraints
- [ ] Target PSP: selected, shortlist, or evaluating, plus top selection criteria
- [ ] Payment methods target state: methods to accept after implementation, with target countries and priority
- [ ] Product lines in scope: Payments, Platform (Connect), Terminal, Issuing, or a combination
- [ ] Team and stakeholders: who owns compliance, infrastructure, frontend, fraud/risk, finance
- [ ] Project context: planned go-live date, hard deadlines, phased rollout vs all at once, internal team availability

See `context/business-info.md` if you want to prepare answers in advance.

---

## Stakeholders to have available

After scoping, the EM will capture requirements from each of the following roles, one at a time. You do not need everyone present at once. It is fine to leave items unanswered — they are tracked as `[Open]` and revisited during reviews and the Implementation Brief.

- [ ] Head of Payments, Payments Lead, or equivalent — KPIs, migration risk, operational governance
- [ ] Compliance Officer and DPO — data privacy, AML/KYC, audit requirements
- [ ] Fraud Officer or risk/operations equivalent — fraud rules, dispute handling, 3DS strategy
- [ ] Backend development lead — API integration, reliability, data security
- [ ] Frontend development lead — checkout UX, design system, state management
- [ ] Solution Architect — integration patterns, data flow, residency, resilience
- [ ] Security Officer or CISO — secret management, webhook security, threat mitigation
- [ ] Finance and Treasury lead — settlement, FX, reconciliation, reporting

---

## Team roles to identify

- [ ] Who can speak to compliance and legal questions (PCI scope, data residency)
- [ ] Who owns infrastructure and deployment decisions
- [ ] Who owns the frontend and checkout experience
- [ ] Who can speak to fraud and risk operations

---

## Starting the session

- [ ] Run `claude` in this directory
- [ ] Run `/start-session`
