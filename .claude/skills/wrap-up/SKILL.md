---
name: wrap-up
description: Produce the Implementation Brief at the end of a PSP integration engagement. Collects open items across all stakeholder requirements files, documents sub-agent outcomes, and saves the final brief to outputs/implementation-briefs/.
disable-model-invocation: false
user-invocable: true
---

# /wrap-up — Produce the Implementation Brief

When the team runs `/wrap-up`, follow these steps as the Engagement Manager (per `CLAUDE.md`).

## Step 1: Confirm readiness

Ask the team to confirm that all in-scope product lines have been addressed and that no blocking sub-agent issues remain unresolved. If blocks remain, do not proceed until they are resolved or explicitly deferred with a recorded owner and deadline.

## Step 2: Collect open items

Scan all `outputs/<engagement>-*-requirements.md` files for items still marked `[Open]`. For each, confirm or assign an owner and a deadline. If a requirements file does not exist for a role (stakeholder was unavailable during `/start-session`), note it as a gap in the brief.

If `outputs/<engagement>-context-validation.md` exists (produced by `/validate-context`), also read it. Carry every `[Unverified]` and `[Blocker]` item from that file into the brief's Unverified Items section without restating verified items.

## Step 3: Write the brief

Save to `outputs/implementation-briefs/<engagement>-brief.md`. Structure:

### Engagement Overview
- Engagement name and date
- PSP and product lines in scope
- Tech stack and markets

### Scope and Decisions
- Key decisions made during the engagement, with rationale
- Any scope items explicitly deferred, with owner and reason

### Implementation Sequence
- The agreed sequence and the current status of each step: complete, in progress, or deferred

### Code and Configuration
- Code examples and configuration produced or referenced during the session, with file paths or inline snippets where relevant

### Sub-Agent Reviews
- One entry per sub-agent invoked: decision reviewed, outcome (approve / flag / block), resolution or deferral

### Requirements Status

One table per stakeholder role for which a requirements file exists:

| Item | Status | Owner |
|---|---|---|
| (from requirements file) | Addressed / [Open] | Name or team |

### Open Items
- All unresolved items across all requirements files and sub-agent reviews
- Each with: description, owner, deadline

### Unverified Items
- All items marked `[Unverified]` during the session
- Each with: topic, what needs confirming, pointer to official documentation

## Step 4: Confirm with the team

Present the brief to the team before saving. Allow corrections. Save the final version once confirmed.
