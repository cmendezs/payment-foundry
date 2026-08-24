# Contributing to payment-foundry

Thank you for your interest in contributing. This document explains the
workflow and expectations.

There is no CI on this repository. The checklist below is the actual merge
gate, not a pre-flight check, review it carefully before opening a PR.

## What this repository is

Payment Foundry is a prompt and reference-content framework, not a code
package. There is no build, test suite, or linter to run. The three things
you are likely to touch are:

- `psps/<psp>/*.md`: PSP-specific reference content (facts, code patterns,
  pitfalls) consumed by the Engagement Manager persona.
- `sub-agents/*.md`: PSP-agnostic specialist review personas.
- `skills/payment-foundry/*/SKILL.md`: the single source of truth for the
  `/start-session`, `/validate-context`, and `/wrap-up` skills.

`CLAUDE.md`'s invariant that these files are "never written to during a
session" describes the AI advisor's own behavior while running an engagement.
It does not apply to you as a contributor: editing `psps/`, `sub-agents/`, and
`skills/` by hand and via pull request is exactly how this project grows.

## Development setup

```bash
git clone https://github.com/cmendezs/payment-foundry.git
cd payment-foundry
```

If you edit any file under `skills/payment-foundry/`, re-run the distribution
script afterward so every supported agent's copy stays in sync:

```bash
./scripts/setup-agents.sh
```

Commit the regenerated files under `.claude/`, `.agents/`, and `.vibe/` along
with your source change.

## Adding or editing a PSP product-line file

Each file under `psps/<psp>/` must open with the standard "Verification
References" block (canonical documentation URLs, API Changelog pointer, PSP
MCP query hints), see any existing file under `psps/stripe/` for the shape.
`/validate-context` reads only that block to check volatile facts, a missing
or incomplete block means the file cannot be validated at engagement time.

- Do not invent URLs. Link only to the PSP's official documentation.
- Do not hardcode feature status (e.g. "beta") where it can be checked against
  the PSP's API changelog or account capabilities instead.
- All code examples must be real and runnable, no pseudocode.

## Adding or editing a specialist sub-agent

Keep sub-agents PSP-agnostic; PSP-specific knowledge belongs in `psps/`, not
in `sub-agents/`. If the new sub-agent should be invoked at additional
decision points, update the mapping table in `CLAUDE.md`.

## Pull request checklist

- [ ] New or changed `psps/<psp>/*.md` files include a complete Verification
      References block
- [ ] No invented documentation URLs
- [ ] Code examples are real and runnable, not pseudocode
- [ ] `scripts/setup-agents.sh` re-run and its output committed, if
      `skills/payment-foundry/` changed
- [ ] `CHANGELOG.md` updated following the existing dated/versioned format
- [ ] `README.md` and its translations updated if the change affects
      user-facing scope or the engagement sequence

## Commit style

Write a concise, descriptive summary of what changed and why, consistent with
the existing commit history (see `git log` for examples). Reference the
version being introduced when the change lands as part of a release, e.g.
`v0.4.0: <summary>`.

## Reporting issues

Please open an issue at https://github.com/cmendezs/payment-foundry/issues and
include:

- What you were trying to do
- The expected result
- The actual result (full error message or unexpected output)
- Version or commit SHA you are running

Security issues follow a different path: see [SECURITY.md](SECURITY.md) and
report privately rather than in a public issue.
