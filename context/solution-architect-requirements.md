# Solution Architect: Requirements Checklist

This is a guide for the questions the Engagement Manager should cover with the team's solution architect, typically after initial scoping (Step 3 of `/start-session`) but before the sequence moves into implementation. These questions are PSP-agnostic and apply to any engagement.

It is not mandatory to answer all questions. Partial answers are useful and can be revisited later. Ask conversationally, skip anything not relevant to this engagement (e.g., migration questions do not apply to a greenfield integration), and record answers in `outputs/<short-engagement-name>/solution-architect-requirements.md`.

These questions define the technical blueprint for the integration. Frame the conversation through a "fail-safe" lens: for each component, ask what the platform's degraded mode looks like if that component fails. For example, if the PSP's webhook service goes down, the goal is a platform that keeps functioning in a reduced state, not one that locks up. The aim is a resilient system, not just an integrated one.

During the review stage and at Implementation Brief time, the `solution-architect` sub-agent checks the integration plan and decisions against the answers recorded here.

## I. Integration Pattern & System Connectivity

These questions define how the platform talks to the PSP.

- What is the architectural "Payment Service" pattern? (Is the PSP API wrapped inside an internal microservice to abstract it, or does the frontend/backend call the PSP directly?)
- How is asynchronous communication for webhooks handled? (Is a message broker or queue, such as Kafka or RabbitMQ, needed to ensure transaction updates are not lost if the service is temporarily unreachable?)
- What is the timeout and retry policy architecture? (How is it ensured that an idempotent request to the PSP does not result in duplicate orders if the initial response times out?)
- How are API authentication and secret management handled? (Is a centralized key management system or vault used for the PSP API keys?)
- What is the plan for latency tolerance? (If the PSP API is slow, how is the checkout thread prevented from hanging and impacting the platform's overall performance?)

## II. Data Flow, Storage & Residency

These questions address where and how data moves.

- What is the single source of truth for tokenization? (For migrating existing customers, what is the architecture for the token-exchange mapping table in the database?)
- What are the data residency requirements for the infrastructure? (Does the PSP integration need to route traffic or store logs strictly within specific regions to comply with GDPR or local laws?)
- How will the new PSP data schema integrate with the data warehouse or data lake? (What is the ETL pipeline strategy for joining PSP settlement data with internal sales data?)
- How is database consistency ensured during the cutover? (If a payment succeeds at the PSP but the internal system fails to record it, what is the automated reconciliation job architecture that closes the gap?)
- What is the PCI DSS scope footprint? (Are iframes or SDKs used so sensitive data never reaches the application servers, or is the platform in-scope and in need of additional network isolation?)

## III. Cross-System Orchestration

These questions ensure payment data flows correctly into the rest of the business stack.

- How is the PSP's transaction state synced with the order management system (OMS)? (Which trigger events, such as `authorization.succeeded`, must automatically update the OMS order status?)
- What is the integration strategy for the ERP or ledger system? (How are the PSP's daily settlement files mapped to internal journal entries and the general ledger?)
- How is the fraud tool feedback loop architected? (If the internal fraud engine flags a transaction, how is that signal pushed to the PSP to inform its risk scoring?)
- How is payment history exposed to customer support tools? (Is a caching layer needed to display recent transactions to agents without querying the PSP's API every time?)
- What is the impact on search and filtering capabilities? (Does the new PSP data structure require updates to the search index or database indexing strategy?)

## IV. Resilience, Scalability & Lifecycle

These questions ensure the platform can survive and evolve.

- How is the kill switch for vendor agnosticism architected? (If the PSP has a global outage, what is the architecture for switching to a backup provider via a feature flag?)
- What is the observability strategy? (Which metrics, such as response time, error rates, and throughput, must be ingested into the monitoring stack, e.g., Datadog or Prometheus, to detect issues before customers do?)
- How is the sandbox or UAT environment architected? (Can full end-to-end payment flows, including edge-case failures, be simulated in the CI/CD pipeline without hitting live limits?)
- What is the capacity plan for the new integration? (How does this architecture handle peak traffic, such as Black Friday, compared to the existing legacy infrastructure?)
- What is the technical roadmap for version upgrades? (How is the code architected so that when the PSP updates its API version, the change can be deployed without a major rewrite?)

## Output

1. Record answers (even partial) in `outputs/<short-engagement-name>-solution-architect-requirements.md`, grouped under the same four headings.
2. Mark unanswered items `[Open]` rather than guessing.
3. Reference this file when the `solution-architect` sub-agent is invoked during reviews and at Implementation Brief time.
