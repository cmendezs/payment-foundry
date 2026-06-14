---
name: validate-context
description: Verify that PSP-specific facts in the loaded psps/ reference content (status, pricing, capability gating, header strings, API versions) are still accurate against the PSP's authoritative sources before implementation begins. Runs once per engagement, after /start-session and before any product-line implementation step.
disable-model-invocation: false
user-invocable: true
---

# /validate-context, Verify Reference Content Against Authoritative Sources

When the team runs `/validate-context`, follow these steps as the Engagement Manager (per `CLAUDE.md`).

This skill is **PSP-agnostic**. It does not contain PSP-specific URLs, MCP tool names, or feature names. It works by reading the standard "Verification References" block at the top of each in-scope product-line file and validating only the items listed there.

## When to Run

- After `/start-session` has produced the requirements files and the engagement sequence is confirmed.
- Before the first implementation step (core payments).
- Once per engagement is enough in most cases. Re-run if a long pause passes between scoping and implementation, or if the team enables a new product line mid-engagement.

## Step 1: Identify scope

Read `psps/<psp>/README.md` to identify the active PSP. Read the engagement scope captured during `/start-session` to identify which product lines are in scope.

If no product lines are in scope yet, stop and ask the team to run `/start-session` first.

Record a short engagement name (same kebab-case slug used by `/start-session`) for the output filename.

## Step 2: Extract Verification References

For each in-scope product line, read the product-line file `psps/<psp>/<product>.md` and extract ONLY the "Verification References" block at the top. Do not load the rest of the file at this step.

A well-formed Verification References block lists:
- Canonical official documentation URLs for this product line, with the topic each covers.
- The PSP's API Changelog URL.
- PSP MCP hints (object/field/endpoint to query when the PSP MCP is connected).
- Volatile items that must be re-verified before relying on the file (e.g., GA/beta status of a feature, header requirements, account-level capability gating).

If a product-line file is missing the Verification References block, record this as a `[Blocker]` and ask the team to add it before proceeding.

## Step 3: Verify each item

For each volatile item listed in the Verification References blocks, attempt verification in this order:

1. **PSP MCP if connected.** If the team has connected the PSP's MCP server (check via the project setup notes, or attempt the MCP query and fall through on error), use it to:
   - Query the live API reference for the field, endpoint, or feature named in the MCP hint.
   - Query the API Changelog for recent changes affecting the topic.
   - Query the connected test account's actual capabilities where applicable.
   Record the source as `MCP: <tool>` and the timestamp.

2. **`WebFetch` on the canonical URL.** If the PSP MCP is not connected, fetch the canonical official documentation URL listed in the Verification References block for that item. Do not invent URLs. Do not use generic `WebSearch`. Only `WebFetch` URLs that the product-line file explicitly declares as canonical.
   Record the source as `WebFetch: <url>` and the timestamp.

3. **Mark `[Unverified]`.** If neither path is available (no MCP, no network access, or the URL did not resolve), record the item as `[Unverified]` with the URL the team should confirm against manually.

## Step 4: Produce the validation output

Write `outputs/<short-engagement-name>/context-validation.md` with this structure:

```markdown
# Context Validation, <engagement>

Generated: <date>
PSP: <psp>
Product lines in scope: <list>
Sources attempted: <PSP MCP / WebFetch / both>

## [Verified]

Items confirmed against an authoritative source during this run.

- **<product line>: <item>**: <one-line finding>. Source: <MCP: tool | WebFetch: url>. Checked: <date>.

## [Unverified]

Items that could not be confirmed automatically. The team should confirm manually before relying on them.

- **<product line>: <item>**: confirm against <URL>. Reason not verified: <no MCP / fetch failed / not in scope of any reference>.

## [Blocker]

Items where the validation step itself cannot proceed.

- **<product line>: <issue>**: <what needs fixing> (e.g., missing Verification References block in `psps/<psp>/<product>.md`).
```

## Step 5: Hand off to implementation

Present the validation file to the team. For each `[Unverified]` item, confirm an owner and a deadline (often the team's own lead, asked to confirm against the PSP docs or their account settings before the relevant implementation step). For each `[Blocker]`, resolve before proceeding.

The validation file is read by `/wrap-up` (which folds `[Unverified]` items into the Implementation Brief's Unverified Items section) and by each sub-agent at review time (which consumes verified facts and flags any review point that depends on an `[Unverified]` item).

## Notes

- This skill does not modify any file under `psps/` or `sub-agents/`. It only reads them and writes to `outputs/`.
- This skill does not perform generic web search. It only fetches URLs that a product-line file explicitly declares as canonical in its Verification References block. This keeps the freshness layer grounded in the same authoritative sources the rest of the engagement uses.
- The validation file is a snapshot in time. Items verified on day 1 of the engagement may have drifted by go-live. Re-running `/validate-context` immediately before launch is a reasonable cautious move for long engagements.
