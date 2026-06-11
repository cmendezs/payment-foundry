# Engagement Context Template

This is a guide for the questions the Engagement Manager should cover during scoping (Step 3 of `/start-session`), not a form for the team to fill out. Ask conversationally, skip anything already covered, and adapt follow-ups to the answers.

## Use Case

- What is being sold or what service is being paid for?
- Who is the customer (consumer, business, internal user)?
- Is this a one-time payment, recurring/subscription, or both?
- Is there a marketplace/platform element (money needs to reach a third party, not just the business)?

## Tech Stack

- Backend language and framework
- Frontend framework (web), and any mobile platforms (iOS, Android, React Native, etc.)
- Where does this run (cloud provider, existing infrastructure)?
- Existing CI/CD setup relevant to testing this integration

## Geography and Markets

- Which countries/regions are customers located in?
- Which currencies need to be supported?
- Where is the business legally established (for account/entity setup)?
- Any known regulatory considerations for these markets (e.g., SCA in the EEA/UK)?
- For multi-market businesses: a single global PSP account, or one account per market/entity? What is driving that choice (e.g., local payment method availability, settlement currency, legal entity structure)?
- If rolling out market by market: what is the sequencing, and what is the reasoning (e.g., smaller/simpler markets first, largest or most complex market last)?

## Timeline

- Target go-live date
- Any hard external deadlines (e.g., tied to a launch event, contract date)?
- Is this a phased rollout (e.g., one market first) or all at once?

## Current State

- Greenfield integration, or migrating from another PSP / replacing an existing setup?
- If migrating: what needs to carry over (saved payment methods, transaction history, connected accounts)?
- Has a Stripe (or other PSP) account already been created? Test mode access available?

## Product Lines in Scope

Ask which of these apply, referencing `psps/<psp-name>/README.md` for what is available:

- Online/in-app payments (Payments)
- Marketplace or platform payouts (Platform/Connect)
- In-person/point-of-sale (Terminal)
- Card issuing to users (Issuing)

If Payments is in scope, also clarify:

- Will accepted payment methods be manually curated per checkout, or dynamically determined by the PSP based on Dashboard configuration?
- Are there specific card brands or networks to exclude, and if so, at which layer should that be enforced (risk rules, backend validation, frontend)?
- If PayPal (or a similar wallet requiring its own merchant account) is in scope: is there a 1:1 mapping between PSP account and wallet account, especially if the business uses multiple PSP accounts across markets?
- What is the policy when a payment is formally disputed, can it still be refunded, or does it route to a separate evidence-submission process? Clarify this with the team early, before building the refund/dispute handling flow.

## Team and Stakeholders

- Who can speak to compliance/legal questions?
- Who owns infrastructure and deployment decisions?
- Who owns the frontend/checkout experience?
- Who on the finance side needs to be involved in settlement/payout decisions?

## Go-Live Readiness Checklist

Use this checklist near the end of the engagement, before the team switches to live credentials, as the basis for the Implementation Brief's go-live readiness section. Adapt PSP-specific items to the PSP in scope.

### Integration

- Edge cases are covered with test data: declines, disputes, authentication challenges (e.g., 3DS), and retries.
- PSP object IDs and key request/event IDs are logged, this is essential for support and debugging conversations with the PSP.
- Production webhook endpoints are configured, verified, and confirmed to be receiving events.
- The integration has been checked for leftover test-mode assumptions (e.g., hardcoded test API keys, test-only object IDs) before switching to live credentials.

### Business readiness

These are often required by card networks or PSPs before a merchant can go live:

- The public-facing site has accurate product and pricing information.
- Terms of service, privacy policy, and refund/cancellation policy are published and accurate.
- Support contact information is visible to customers.

### Penny test

- A low-value transaction (typically 1 unit of the relevant currency, e.g. $1 USD) is run end to end with live credentials before any larger payment is processed.
- The statement descriptor shown to the customer matches expectations.
- Any applicable SCA/3DS challenge flows behave as expected for the live account.
- The transaction appears correctly in the PSP dashboard and flows through to the payout/settlement schedule as expected.
- The penny test transaction is refunded or accounted for once verified.

### Account configuration

- Public account details and statement descriptor are set and recognizable to customers (see `psps/stripe/payments.md` Statement Descriptors, where applicable).
- Payout/settlement bank details are confirmed.
- Team members have been invited to the PSP dashboard with appropriate roles and permissions.
- Webhook secrets, API keys, and other credentials are stored per `sub-agents/security-officer.md` guidance, not hardcoded.

## Output

Once these are answered (even partially), the EM should:

1. Confirm understanding back to the team in 2-3 sentences
2. Propose a sequence for the engagement (see "Sequencing the Engagement" in `CLAUDE.md`)
3. Note anything still unclear as an open item to revisit
