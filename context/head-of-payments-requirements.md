# Head of Payments: Requirements Checklist

This is a guide for the questions the Engagement Manager should cover with the team's payments leadership (Head of Payments, Payments Lead, or equivalent), typically after initial scoping (Step 3 of `/start-session`) but before the sequence moves into implementation. These questions are PSP-agnostic and apply to any engagement.

It is not mandatory to answer all questions. Partial answers are useful and can be revisited later. Ask conversationally, skip anything not relevant to this engagement (e.g., migration questions do not apply to a greenfield integration), and record answers in `outputs/<short-engagement-name>/head-of-payments-requirements.md`.

During the review stage and at Implementation Brief time, the `head-of-payments` sub-agent checks the integration plan and decisions against the answers recorded here.

## I. KPI Monitoring & Performance Management

- What is the "Day 1" definition of success for the new PSP? (e.g., is stability prioritized over performance metrics in the first 30 days?)
- How will Authorization Rate performance be visualized by segment? (Performance needs to be tracked by card type, currency, and country, not only as a global aggregate.)
- What is the threshold for "False Declines," and how will this be actively monitored to avoid losing revenue?
- How will the new PSP's refund workflows map into the internal ERP to ensure zero-discrepancy reconciliation?
- What is the strategy for automating dispute and chargeback evidence submission to minimize manual operational load?
- How is "Soft Decline" retry logic configured to maximize recovery of transactions?

## II. Migration, Testing & Risk

- What is the phased rollout strategy? (Is traffic split by percentage, geography, or payment method type?)
- How will the dual-provider state be managed during the transition to prevent data fragmentation?
- What is the rollback trigger? (e.g., if conversion drops by X% on Day 1, at what point does the team revert to the legacy system?)
- How will payment tokenization migration be tested and validated to avoid customer churn?
- Does the PSP's sandbox environment accurately replicate production logic for edge cases, so staging tests hold up in live conditions?

## III. Operational Workflow & Governance

- What is the updated internal "Payment Playbook"? (Are new Standard Operating Procedures needed for handling payment errors?)
- What is the operational cadence with the PSP's support team during the first 90 days? (e.g., weekly performance reviews vs. ad-hoc support)
- How are alert thresholds defined? (At what volume of failed transactions should the team be automatically paged, and who is the first point of contact?)
- Who on the team requires "Super-User" access to the PSP dashboard, and what are their specific responsibilities?
- How will BI/reporting dashboards remain accurate during the cutover? Does the new API data structure align with existing internal reporting?

## IV. Global Alignment & Future-Proofing

- How does the multi-entity account structure align with global payout needs? (Are funds and reporting segregated correctly across legal entities?)
- Which regions are the highest priority for the rollout, and how does the PSP support those regions' local regulatory requirements?
- How is "Platform" logic kept agnostic? (Is logic hardcoded for this PSP, or built as a layer that makes it easy to switch or add providers later?)
- Where is the most "operational friction" expected in the first 90 days, and what is the mitigation plan?

## Output

1. Record answers (even partial) in `outputs/<short-engagement-name>-head-of-payments-requirements.md`, grouped under the same four headings.
2. Mark unanswered items `[Open]` rather than guessing.
3. Reference this file when the `head-of-payments` sub-agent is invoked during reviews and at Implementation Brief time.
