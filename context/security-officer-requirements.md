# Security Officer: Requirements Checklist

This is a guide for the questions the Engagement Manager should cover with the team's Security Officer or CISO, typically after initial scoping (Step 3 of `/start-session`) but before the sequence moves into implementation. These questions are PSP-agnostic and apply to any engagement.

It is not mandatory to answer all questions. Partial answers are useful and can be revisited later. Ask conversationally, skip anything not relevant to this engagement (e.g., admin dashboard SSO questions may not apply to a small team), and record answers in `outputs/<short-engagement-name>/security-officer-requirements.md`.

Frame this conversation as moving from "Is the vendor secure?" to "How do we configure our infrastructure so the integration does not become our weakest link?" Approach the Security Officer as a risk-reduction partner: describe the component being built (e.g., the webhook handler) and ask what specific validation logic, headers, or controls they require in the code, rather than asking for a general approval.

During the review stage and at Implementation Brief time, the `security-officer` sub-agent checks the integration plan and decisions against the answers recorded here.

## I. Identity & Secret Management

These questions ensure the keys to the kingdom are handled with enterprise-grade protection.

- What is the architecture for secret management? (Are PSP API keys stored in a dedicated secrets manager, such as HashiCorp Vault, AWS Secrets Manager, or Azure Key Vault, rather than environment variables alone?)
- What is the policy for credential rotation? (What is the automated workflow for rotating PSP API keys and passwords, and how is zero downtime ensured during rotation?)
- What is the least-privilege access model for developers? (How is it ensured that no single engineer holds both production API key access and the ability to modify the payment codebase?)
- How is service-to-service authentication handled? (Is mTLS or a service mesh/SPIFFE used to ensure only authorized internal microservices can request payments?)
- What is the emergency revocation protocol? (In the event of a key compromise, what is the automated procedure to revoke and rotate keys globally within one hour?)

## II. Webhook & API Security

These questions secure the inbound channel where the PSP communicates with the platform.

- What is the mandatory verification strategy for webhook signatures? (What is the architectural requirement for HMAC validation and the signature comparison logic?)
- How is the platform protected against replay attacks on webhooks? (Is timestamp or nonce verification implemented in the middleware to prevent attackers from re-sending old webhooks?)
- Is IP whitelisting required for incoming webhooks? (If the PSP provides static IPs, are firewalls or the WAF configured to allow only that traffic to the webhook endpoint?)
- What is the DoS/DDoS protection strategy for the webhook endpoint? (What rate-limiting thresholds are needed to ensure the webhook handler is not overwhelmed by malicious traffic?)
- How is payload data integrity ensured? (Is logging or checksumming in place to verify that the webhook data received matches what the PSP sent?)

## III. Fraud Controls & Threat Mitigation

These questions treat fraud defense as an internal security layer, not just a vendor feature.

- How is the suspicious-transaction alerting system built? (What metadata from high-risk PSP signals needs to be routed to the SIEM?)
- What are the security requirements for the payment UI to prevent injection attacks? (How are Content Security Policy (CSP) headers enforced on the checkout page to prevent XSS or DOM manipulation?)
- How is access to the PSP admin dashboard audited? (Is the PSP's admin panel integrated with the internal SSO/MFA provider, and is MFA enforced on all accounts?)
- How is PII scrubbed from application logs? (What masking or regex requirements apply to centralized logging, such as ELK or Splunk, to ensure CVV or PAN data is never stored in cleartext?)
- What is the human-in-the-loop requirement for high-risk operations? (For actions such as bulk refunds, is a two-person "four-eyes" approval required in the system?)

## IV. Compliance, Lifecycle & Audit

These questions address the long-term security posture of the integration.

- How is the PCI DSS scope boundary defined? (Does the architecture keep PAN data out of the server environment, and has the Security Officer signed off on this?)
- What is the incident response plan for a PSP breach? (What is the kill-switch architecture to prevent data exfiltration from the platform's side if the PSP is compromised?)
- How is the security of third-party dependencies verified? (Is an automated Software Composition Analysis (SCA) scan run against the PSP's SDK, and what is the passing threshold for vulnerabilities?)
- How is chain of custody maintained for payment logs? (For regulatory or GDPR audits, how long must payment transaction logs be retained, and how is immutability ensured?)
- What is the security acceptance criteria for go-live? (What pentest or scan must be run against the new integration code before production sign-off?)

## Output

1. Record answers (even partial) in `outputs/<short-engagement-name>-security-officer-requirements.md`, grouped under the same four headings.
2. Mark unanswered items `[Open]` rather than guessing.
3. Reference this file when the `security-officer` sub-agent is invoked during reviews and at Implementation Brief time.
