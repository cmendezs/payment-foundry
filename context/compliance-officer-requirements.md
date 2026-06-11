# Compliance Officer: Requirements Checklist

This is a guide for the questions the Engagement Manager should cover with the team's Compliance Officer and Data Protection Officer (DPO), typically after initial scoping (Step 3 of `/start-session`) but before the sequence moves into implementation. These questions are PSP-agnostic and apply to any engagement.

It is not mandatory to answer all questions. Partial answers are useful and can be revisited later. Ask conversationally, skip anything not relevant to this engagement (e.g., AML/KYC questions may be lighter for a low-volume B2B integration), and record answers in `outputs/<short-engagement-name>-compliance-officer-requirements.md`.

Frame these as system configuration requests rather than abstract compliance questions. For example, instead of "Are we GDPR compliant?", ask "Which fields here are personal data, so the correct retention policy can be applied in the database?". This keeps the answers actionable for implementation.

During the review stage and at Implementation Brief time, the `compliance-officer` sub-agent checks the integration plan and decisions against the answers recorded here.

## I. Data Flow & Privacy Engineering (GDPR/DPO Focus)

- Which specific user PII fields must be masked or anonymized before they hit internal logging/analytics systems after passing through the PSP?
- What is the technical requirement for the "Right to Erasure" (RTBF) workflow? (e.g., a script to trigger deletion requests to the PSP's API, or a TTL policy to configure?)
- How are the data flows for this PSP mapped in the Record of Processing Activities (ROPA)? What technical documentation does the DPO need to finalize this update?
- Where must mandatory disclosure notices be placed in the checkout flow? (e.g., wording for SEPA, card scheme disclosures, or cross-border processing notices required by the license)
- How should "Data Residency" be handled in the API? Does traffic need to be routed based on the user's origin to comply with local data sovereignty laws?

## II. AML, KYC, and Transaction Monitoring Requirements

- What is the operational trigger for internal fraud investigations? At what volume or velocity of transactions should the PSP's API push an alert to the internal compliance dashboard?
- What raw data fields from the PSP are required in monthly compliance exports, so the ETL pipeline can be built for these fields?
- What is the defined Suspicious Activity Report (SAR) workflow? Is a "Flag for Review" action needed in the internal admin panel for the support team?
- How is the "Blacklist/Blocked Users" list synchronized with the PSP? Is real-time sync required, or is a daily batch upload sufficient?
- What is the requirement for customer identity verification data pass-through? If the PSP performs its own KYC, what status signals need to be stored to evidence due diligence?

## III. Operational Governance & Audit Readiness

- What is the frequency for the compliance reconciliation report (daily, weekly, monthly), so reporting intervals can be defined in the BI setup?
- Which events must be hard-coded into the audit logs? (e.g., change of bank account, refund to a non-original card, high-value payout)
- What is the "Compliance Kill Switch" requirement? If a systemic issue is identified, how quickly must this PSP be programmatically disabled across the platform?
- How is the exception workflow for manual compliance approvals handled? Is a queue needed in the admin tool for manual approval/rejection of flagged transactions?
- What is the documentation requirement for third-party vendor assessments? What evidence needs to be collected from the PSP during the integration phase?

## IV. Regulatory & Partner Alignment

- How do payment terms need to reflect this PSP's settlement behavior? What updates are needed to user agreements regarding payout timings or currency conversion?
- What is the protocol for SCA exemptions? When should the integration attempt exemptions versus mandate full 3DS2?
- Who is the designated incident commander for a payment-related data breach, so this can be built into system alerts?
- What training modules need to be developed for the customer support team? (e.g., handling chargeback questions, privacy rights in the new checkout)
- What is the acceptance criteria for compliance sign-off? What specific tests or items need to be reviewed before formal sign-off on the production release?

## Output

1. Record answers (even partial) in `outputs/<short-engagement-name>-compliance-officer-requirements.md`, grouped under the same four headings.
2. Mark unanswered items `[Open]` rather than guessing.
3. Reference this file when the `compliance-officer` sub-agent is invoked during reviews and at Implementation Brief time.
