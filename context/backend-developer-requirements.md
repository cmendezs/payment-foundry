# Backend Developer: Requirements Checklist

This is a guide for the questions the Engagement Manager should cover with the team's backend development lead, typically after initial scoping (Step 3 of `/start-session`) but before the sequence moves into implementation. These questions are PSP-agnostic and apply to any engagement.

It is not mandatory to answer all questions. Partial answers are useful and can be revisited later. Ask conversationally, skip anything not relevant to this engagement (e.g., migration questions do not apply to a greenfield integration), and record answers in `outputs/<short-engagement-name>-backend-developer-requirements.md`.

Frame these as system constraints rather than open design questions. For example, instead of "How do we handle retries?", ask "Our reliability requirement is 99.99% uptime. To achieve this, how are we architecting our retry logic and circuit breakers to handle the new PSP's API without creating duplicate charges?"

During the review stage and at Implementation Brief time, the `backend-developer` sub-agent checks the integration plan and decisions against the answers recorded here.

## I. API Integration & Transaction Integrity

These questions define the contract between the platform and the PSP.

- How are idempotency keys implemented for every request? (To ensure that a timed-out request does not result in a double charge upon retry.)
- What is the strategy for handling asynchronous webhooks? (How is delivery and ordering of webhooks guaranteed if the PSP hits the endpoint multiple times out of order?)
- How are incoming webhooks authenticated and validated? (What mechanism verifies the PSP's signature to prevent rogue requests?)
- How is rounding and precision handled across different currencies? (To prevent float math errors where the PSP uses different decimal standards than the legacy database.)
- How is request timeout logic implemented? (At what point does the system give up on the PSP response to prevent a cascading failure in the checkout flow?)

## II. Reliability, Resilience, & State Management

These questions ensure the system remains stable when things go wrong.

- What is the circuit breaker pattern for this PSP? (If PSP API latency spikes, how is the checkout service prevented from hanging or crashing?)
- How is state managed for a payment in progress? (What state machine tracks transitions such as Authorized to Captured to Settled, including mid-state failures?)
- What is the retry policy for soft declines? (Is there a background worker that retries a transaction after a delay, or is this managed on the frontend?)
- How are race conditions handled? (If a user clicks "Pay" multiple times, how does the backend ensure only one transaction is processed?)
- What is the failover or fallback architecture? (If the PSP is down, how does the system gracefully switch to a legacy provider or backup method without failing the order?)

## III. Data Security, Migration, & Storage

These questions cover keeping PCI scope low and migrating existing data.

- What is the technical approach for token migration? (How are existing payment tokens moved securely from the old provider's vault to the new one without breaking recurring subscriptions?)
- How is PCI DSS scope reduction ensured? (Confirm that cardholder data never touches application server memory, using hosted fields, iframes, or an SDK.)
- How is sensitive data masked in application logs? (What middleware scrubs card details or CVVs before logs are indexed?)
- What is the data retention policy for transaction metadata? (Are specific PII fields purged or encrypted after a defined period to meet GDPR requirements?)
- How is idempotency key storage handled in the database? (Is there a high-performance cache, such as Redis, for recent transaction keys to prevent duplicates?)

## IV. Observability, Logging, & Maintenance

These questions ensure the integration can be debugged in production.

- What tracing or correlation IDs are injected? (How is a user's session ID correlated with the PSP's transaction ID for rapid debugging of failed orders?)
- How are alert thresholds set up for the payment gateway? (At what percentage of 5xx errors or connection timeouts is an automated alert triggered to the SRE team?)
- How is the reconciliation engine designed? (What nightly job downloads the PSP's settlement report and matches it against the internal order ledger, and in what format?)
- How is a mock or test environment created for the CI/CD pipeline? (How are different response codes, such as a 3DS challenge, auth failure, or timeout, simulated without hitting the live API?)
- What is the kill switch implementation? (What environment variable or flag allows this PSP integration to be disabled globally within seconds if a critical bug is discovered?)

## Output

1. Record answers (even partial) in `outputs/<short-engagement-name>-backend-developer-requirements.md`, grouped under the same four headings.
2. Mark unanswered items `[Open]` rather than guessing.
3. Reference this file when the `backend-developer` sub-agent is invoked during reviews and at Implementation Brief time.
