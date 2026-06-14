---
name: wrap-up
description: Produce the end-of-engagement artifacts: an executive Implementation Brief, a code-heavy Detailed Implementation Guide, and a per-engagement Go-Live Readiness Checklist. Collects open items across all stakeholder requirements files and finalizes any code accumulated during the session.
disable-model-invocation: false
user-invocable: true
---

# /wrap-up — Produce the Engagement Artifacts

When the team runs `/wrap-up`, follow these steps as the Engagement Manager (per `CLAUDE.md`). The wrap-up produces three artifacts under `outputs/<short-engagement-name>/`:

- `implementation-brief.md`: executive layer (decisions, action items, open and unverified items, requirements status).
- `implementation-detailed.md`: developer manual with runnable code per component.
- `go-live-checklist.md`: per-engagement checklist adapted from the template.

## Step 1: Confirm readiness

Ask the team to confirm that all in-scope product lines have been addressed and that no blocking sub-agent issues remain unresolved. If blocks remain, do not proceed until they are resolved or explicitly deferred with a recorded owner and deadline.

## Step 2: Collect open items

Scan all `outputs/<short-engagement-name>/*-requirements.md` files for items still marked `[Open]`. For each, confirm or assign an owner and a deadline. If a requirements file does not exist for a role (stakeholder was unavailable during `/start-session`), note it as a gap in the brief.

If `outputs/<short-engagement-name>/context-validation.md` exists (produced by `/validate-context`), also read it. Carry every `[Unverified]` and `[Blocker]` item from that file into the brief's Open and Unverified Items section without restating verified items.

## Step 3: Write the Implementation Brief

Save to `outputs/<short-engagement-name>/implementation-brief.md`. Keep this document tight, a returning EM or stakeholder should pick up the engagement by reading only this file. Structure:

### 1. Executive Summary

- Engagement name and date
- PSP and product lines in scope
- Tech stack and markets (one or two lines)
- Go-live target and current status (e.g., "Spain ready for go-live pending account creation", "EU rollout proceeding one market per month")

### 2. Decisions Log

- Key decisions made during the engagement, with rationale (e.g., integration pattern choice, multi-entity structure, payment method strategy, rollout approach)
- Scope items explicitly deferred, with owner and reason
- Sub-agent reviews invoked, one row each: sub-agent name, what was reviewed, verdict (approve / flag / block), resolution or deferral

### 3. Action Items for Next Session

- Top follow-ups the next session should pick up first, formatted as: Owner, Item, Deadline
- A short "Pick up here" paragraph describing what to tackle first when the engagement resumes

### 4. Open and Unverified Items

- Open Items table: description, owner, deadline (sourced from requirements files and sub-agent reviews)
- Unverified Items table: topic, what needs confirming, pointer to the official PSP documentation
- Requirements Status: one short table per stakeholder role for which a requirements file exists, showing Item, Status (Addressed or `[Open]`), Owner

## Step 4: Finalize the Detailed Implementation Guide

If `outputs/<short-engagement-name>/implementation-detailed.md` already exists (accumulated during the session per the code-logging guidance in `CLAUDE.md`), open it and reorganize the existing content into the structure below. Otherwise create it, reconstructing component code from the session context.

Structure:

### Project Context

- Tech stack, hosting, frontend, mobile
- Legal entities and PSP accounts (test and live, with identifiers when known)
- Markets and rollout milestones (LaRedoute-style chronological table)
- Stripe Stakeholders or PSP contacts, if captured

### Implementation Sequence

- The agreed sequence and the current status of each step: complete, in progress, deferred, out of scope

### Components

For each component produced during the session, in implementation order, write:

- Component name and purpose
- Where it lives in the team's stack (file path or service name if known)
- The actual runnable code from the session, in a language-tagged fenced code block matching the team's stack
- Configuration, environment variables, or secrets the component depends on
- Notes on idempotency, error handling, retries, or PSP-specific gotchas referenced from `psps/<psp>/` files

Typical component order:

1. Configuration (e.g., per-entity credentials)
2. Customer or account setup
3. Core payments: PaymentIntent creation, Payment Element, confirmation
4. Refunds
5. Subscriptions and one-time fees, if Billing is in scope
6. Webhook handling, with full handler code and per-event behavior
7. Idempotency layer (event processing, request retry handling)
8. Reconciliation and cleanup jobs
9. Platform/Connect, Terminal, or Issuing flows, if in scope

Code blocks must be the actual runnable code shown during the session, not a paraphrase. If code for a component was discussed but not produced, mark it `[To be implemented]` with a brief description and the design decisions already agreed.

## Step 5: Write the Go-Live Readiness Checklist

Load `context/go-live-checklist-template.md` and copy its content into `outputs/<short-engagement-name>/go-live-checklist.md`. Then adapt it to the engagement:

- Replace PSP-specific references (e.g., Stripe doc paths) with the PSP actually in scope.
- Pre-check items already addressed during the engagement, citing the relevant decision or code in `implementation-detailed.md`.
- For items not yet addressed, assign an owner if known and leave the checkbox empty.
- Add a final "Open Owners" line listing who is accountable for each unchecked item.

## Step 6: Confirm with the team

Present the three documents to the team before saving the final versions. Allow corrections. Save once confirmed.
