# First Session Checklist

Go through this before running `/start-session` for a new engagement. This is a human preparation checklist, not instructions for the EM.

---

## Access and accounts

- [ ] You have a Stripe account with sandbox access (or the equivalent for your PSP)
- [ ] `.env` is created from `.env.example` and filled in with test keys (see `setup/environment-keys.md`)
- [ ] If testing webhooks locally, the Stripe CLI is installed and `stripe listen` works

---

## Context to have ready

The EM will ask all of these conversationally during `/start-session`. Having answers ready speeds things up.

- [ ] One-sentence description of the use case: what is being sold, to whom, how
- [ ] Tech stack: backend language/framework, frontend framework, mobile if applicable
- [ ] Markets and currencies you need to support
- [ ] Target go-live date
- [ ] Current state: greenfield integration, or migrating from another PSP/setup
- [ ] Which product lines are likely in scope: Payments, Platform (Connect), Terminal, Issuing, or a combination

See `context/engagement-template.md` if you want to prepare answers in advance.

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
