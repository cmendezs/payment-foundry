---
name: start-session
description: Start a new PSP integration engagement. Detects which PSP the team is integrating, loads the matching psps/ folder, scopes the engagement, captures stakeholder requirements, and proposes the implementation sequence.
disable-model-invocation: false
user-invocable: true
---

# /start-session — Begin a PSP Integration Engagement

When the team runs `/start-session`, follow these steps as the Engagement Manager (per `CLAUDE.md`).

## Step 1: Identify the PSP

Ask which PSP the team is integrating. If they have already named it in their message, do not ask again.

## Step 2: Check for support

Look for `psps/<psp-name>/README.md` (lowercase, kebab-case folder name, e.g., `stripe`).

- **If the folder and README exist:** read it. It indexes the available product-line files (Payments, Platform, Terminal, Issuing, etc.) for that PSP.
- **If it does not exist:** tell the team plainly that this PSP is not yet supported. List which PSPs are available by checking `psps/` for existing folders with a `README.md`. Do not improvise guidance for the unsupported PSP. End the session here.

## Step 3: Scope the engagement

Load `context/engagement-template.md`. Use it as a conversational guide, not a form to fill out. Cover:

- Use case: what is being sold, to whom, how
- Tech stack: backend language/framework, frontend framework, mobile if applicable
- Markets and currencies
- Target go-live date
- Current state: greenfield or migrating from another PSP/setup
- Product lines likely in scope: use the PSP README to know what is available

Record a short engagement name (kebab-case, e.g., `acme-payments`) for use in all output filenames.

## Step 4: Capture stakeholder requirements

For each role below, load the corresponding context file, walk through it conversationally with whoever in that role is available, and write the output to `outputs/<engagement>-<role>-requirements.md`. Mark any unanswered item `[Open]`.

Not every role needs to be present. Capture what is available and mark the rest `[Open]`. These files are loaded later by their respective sub-agents at review time, not now.

Work through roles in this order, skipping any where no stakeholder is available:

| Role | Context file | Output file |
|---|---|---|
| Head of Payments | `context/head-of-payments-requirements.md` | `outputs/<engagement>-head-of-payments-requirements.md` |
| Compliance Officer / DPO | `context/compliance-officer-requirements.md` | `outputs/<engagement>-compliance-officer-requirements.md` |
| Fraud Officer | `context/fraud-officer-requirements.md` | `outputs/<engagement>-fraud-officer-requirements.md` |
| Backend Developer | `context/backend-developer-requirements.md` | `outputs/<engagement>-backend-developer-requirements.md` |
| Frontend Developer | `context/frontend-developer-requirements.md` | `outputs/<engagement>-frontend-developer-requirements.md` |
| Solution Architect | `context/solution-architect-requirements.md` | `outputs/<engagement>-solution-architect-requirements.md` |
| Security Officer / CISO | `context/security-officer-requirements.md` | `outputs/<engagement>-security-officer-requirements.md` |
| Finance and Treasury | `context/finance-treasury-requirements.md` | `outputs/<engagement>-finance-treasury-requirements.md` |

Load each context file only when that role is the active conversation. Release it before moving to the next role.

## Step 5: Propose the engagement sequence

Based on the product lines confirmed in scope, present a tailored version of the standard sequence from `CLAUDE.md`. Confirm it with the team before proceeding.
