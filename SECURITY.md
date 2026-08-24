# Security Policy

## Supported versions

Security fixes are applied to the latest published minor release only. Older
versions do not receive backported patches; upgrade to the current release to
stay supported.

| Version | Supported |
|---|---|
| 0.3.x | Yes |
| < 0.3.0 | No |

## Reporting a vulnerability

Report suspected vulnerabilities privately through GitHub, not in a public
issue or pull request:

1. Go to the repository Security tab: https://github.com/cmendezs/payment-foundry/security
2. Select **Report a vulnerability** to open a private security advisory.
3. Describe the issue, the affected version, and a minimal reproduction.

You will receive an acknowledgement on a best-effort basis. This is a
volunteer-maintained open-source project, so response times vary; please allow
a reasonable window before any public disclosure.

## Scope and data-handling note

Payment Foundry is an engagement-advisory framework: it does not process live
payments and holds no PCI scope of its own. The risk surface that matters here
is engagement data. A running engagement can produce files under `outputs/`
containing a company's business profile, stakeholder requirements, and code
examples that may reference API keys or other credentials by placeholder. These
files are gitignored by default and are not meant to leave the local machine;
treat any report that touches them as sensitive.

If you are reporting an issue that involves sensitive data (real credentials,
personal data, financial identifiers, private keys, or production secrets),
use only synthetic data in the report itself. Never attach real values to a
public or private advisory, and never paste the contents of an `outputs/`
directory into an issue. Redact any such values from logs and reproductions
before sharing.

## Out of scope

- Vulnerabilities in third-party PSPs or platforms referenced by this project's
  guidance (Stripe and others). Report those to the operator concerned.
- Findings that require a compromised local machine or a malicious dependency
  already installed in the runtime.
