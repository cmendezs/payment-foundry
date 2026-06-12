# Fraud Officer: Requirements Checklist

This is a guide for the questions the Engagement Manager should cover with the team's Fraud Officer (or equivalent risk/operations owner), typically after initial scoping (Step 3 of `/start-session`) but before the sequence moves into implementation. These questions are PSP-agnostic and apply to any engagement.

It is not mandatory to answer all questions. Partial answers are useful and can be revisited later. Ask conversationally, skip anything not relevant to this engagement (e.g., dispute automation questions may be lighter for a low-volume B2B integration), and record answers in `outputs/<short-engagement-name>/fraud-officer-requirements.md`.

Frame these as system configuration requests rather than abstract risk questions. For example, instead of "Can the PSP do velocity checks?", ask "To configure velocity rules, what are the thresholds (attempts per card, IP, or device, per time window) the team wants enforced?". This keeps the answers actionable for implementation.

During the review stage and at Implementation Brief time, the `fraud-officer` sub-agent checks the integration plan and decisions against the answers recorded here.

## I. Integration & Data Orchestration

- What metadata fields (device ID, fingerprinting, IP address, user agent) need to be passed to the PSP's API to give its risk engine maximum signal strength?
- Is a "risk signal" webhook needed to capture the PSP's score and decision for every transaction, feeding the platform's long-term user risk analysis?
- How do internal risk flags (e.g., account age, known-bad-user status) map to the PSP's custom input fields to influence its scoring logic?
- Is a real-time synchronization mechanism needed for blocked entities? If a user or IP is banned internally, how quickly does that block need to reach the PSP's gateway?
- Which fields from the 3DS2 response (e.g., challenge type, exemption reason) need to be logged for the internal audit trail, to support disputing "friendly fraud" claims later?

## II. Dispute & Chargeback Management

- Should dispute status updates be fetched automatically via API, or is a manual CSV upload process sufficient for now?
- What data points does the evidence-submission workflow need to capture, so proof (invoices, shipping logs, geolocation) can be bundled to match the PSP's dispute API requirements?
- How should the internal dispute dashboard categorize incoming claims? What mapping is needed from the PSP's generic dispute codes to internal categories (e.g., "item not received", "unrecognized charge")?
- How should partial refunds be handled when a dispute is open? Does the ledger need a dedicated "dispute credit" status for this case?
- What status should the Order Management System use when the PSP flags a transaction for manual review, to ensure fulfillment is held until the review resolves?

## III. Fraud Prevention Rules & Logic

- What velocity rule thresholds (e.g., maximum attempts per card, IP, or device within a time window) should be configured in the PSP's risk engine, and how should they be monitored?
- What is the secure protocol for a customer support agent to override a block on a legitimate customer who was caught by the fraud engine?
- Is a capture delay needed between authorization and capture, to give the fraud engine time to re-score the transaction before funds move?
- Should guest checkout carry stricter fraud challenges than logged-in users, and if so, what does that look like in practice?
- What thresholds (e.g., failed attempts within a time window) should trigger an automated response to card-cracking patterns, and what should that response be (block, challenge, review)?

## IV. Reporting, Audit & Operational Resilience

- Which fields are non-negotiable in daily or weekly fraud reporting for internal audit and review?
- If the PSP's fraud engine experiences latency or downtime, what is the failover posture: allow transactions through, or block new transactions until the engine recovers?
- What conditions define a "high risk" event that should trigger an immediate alert to the fraud team through the platform's notification system?
- What feedback loop is needed to send confirmed-fraud labels back to the PSP, so its models learn from this platform's specific patterns?
- What are the success metrics for the first 90 days (e.g., reduction in false positives, decrease in manual review volume), so the implementation roadmap can be prioritized accordingly?

## Output

1. Record answers (even partial) in `outputs/<short-engagement-name>-fraud-officer-requirements.md`, grouped under the same four headings.
2. Mark unanswered items `[Open]` rather than guessing.
3. Reference this file when the `fraud-officer` sub-agent is invoked during reviews and at Implementation Brief time.
