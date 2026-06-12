# Go-Live Readiness Checklist Template

Source template for the per-engagement go-live checklist. At `/wrap-up`, this template is copied and adapted into `outputs/<engagement>/go-live-checklist.md` with PSP-specific items adjusted to the PSP actually in scope, and items already addressed during the engagement pre-checked.

This checklist runs near the end of the engagement, before the team switches to live credentials.

## Integration

- [ ] Edge cases are covered with test data: declines, disputes, authentication challenges (e.g., 3DS), and retries.
- [ ] PSP object IDs and key request/event IDs are logged, this is essential for support and debugging conversations with the PSP.
- [ ] Production webhook endpoints are configured, verified, and confirmed to be receiving events.
- [ ] The integration has been checked for leftover test-mode assumptions (e.g., hardcoded test API keys, test-only object IDs) before switching to live credentials.

## Business Readiness

These are often required by card networks or PSPs before a merchant can go live:

- [ ] The public-facing site has accurate product and pricing information.
- [ ] Terms of service, privacy policy, and refund/cancellation policy are published and accurate.
- [ ] Support contact information is visible to customers.

## Penny Test

- [ ] A low-value transaction (typically 1 unit of the relevant currency, e.g. $1 USD) is run end to end with live credentials before any larger payment is processed.
- [ ] The statement descriptor shown to the customer matches expectations.
- [ ] Any applicable SCA/3DS challenge flows behave as expected for the live account.
- [ ] The transaction appears correctly in the PSP dashboard and flows through to the payout/settlement schedule as expected.
- [ ] The penny test transaction is refunded or accounted for once verified.

## Account Configuration

- [ ] Public account details and statement descriptor are set and recognizable to customers (see `psps/stripe/payments.md` Statement Descriptors, where applicable).
- [ ] Payout/settlement bank details are confirmed.
- [ ] Team members have been invited to the PSP dashboard with appropriate roles and permissions.
- [ ] Webhook secrets, API keys, and other credentials are stored per `sub-agents/security-officer.md` guidance, not hardcoded.

## Support Model

- [ ] PSP support tier, escalation path, and incident-response SLA are confirmed with the PSP account team and documented.
