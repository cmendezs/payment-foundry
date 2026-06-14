# Payment Foundry — Changelog

Entries are organised by date (newest first) and by version. Each entry records what changed and the commit it shipped in.

---

## How to update this file

When a meaningful change is made to the engagement framework:
1. Add a dated, versioned section at the top.
2. Summarise what changed and why, with the commit hash.
3. If a GitHub release or tag is created, record the tag name and link here.

---

## 2026-06-14

### v0.2.0 — Multi-platform agent support

- Skills moved to `skills/payment-foundry/<skill>/SKILL.md`, the new single source of truth for `/start-session`, `/validate-context`, and `/wrap-up`.
- `scripts/setup-agents.sh` added: distributes `skills/payment-foundry/` into `.claude/skills/` (Claude Code), `.agents/skills/payment-foundry/` (Google Antigravity / AWS Kiro), and `.vibe/agents/payment-foundry.toml` (Mistral Vibe).
- `setup/installation-guide.md` updated with a new "Bootstrap AI Agent Frameworks" step running the setup script.
- `setup/other-agents.md` rewritten to document the shared-source architecture and per-tool notes for Antigravity, Kiro, and Vibe.
- `README.md` updated to present payment-foundry as usable from Claude Code, Google Antigravity, AWS Kiro, and Mistral Vibe.

Tagged `v0.2.0`.

---

## 2026-06-12

### v0.1.0 — Initial engagement framework

- Initial scaffold of the Engagement Manager framework: `CLAUDE.md`, `AGENTS.md`, `README.md`.
- `.claude/skills/start-session/SKILL.md`, `.claude/skills/validate-context/SKILL.md`, `.claude/skills/wrap-up/SKILL.md` added.
- `context/` populated with per-role requirements templates and `engagement-template.md`.
- `psps/stripe/` PSP reference content and `sub-agents/` specialist definitions added.
- `setup/first-session-checklist.md` added.
- (`6a3497b`)

Updated after the first end-to-end test run:

- `context/business-info.md` added: persistent company profile template, refreshed in place across engagements rather than copied per engagement.
- `context/go-live-checklist-template.md` added: per-engagement go-live checklist template, adapted at `/wrap-up`.
- `context/engagement-template.md` removed, superseded by `business-info.md` and the go-live checklist template.
- `.claude/skills/start-session/SKILL.md`, `.claude/skills/validate-context/SKILL.md`, and `.claude/skills/wrap-up/SKILL.md` updated based on first end-to-end test run.
- `CLAUDE.md`, `AGENTS.md`, `README.md`, and `setup/first-session-checklist.md` updated to reflect the revised context-routing and output structure.
- Per-role requirements files in `context/` (`backend-developer-requirements.md`, `compliance-officer-requirements.md`, etc.) updated with minor corrections.
- `psps/stripe/testing-and-ops.md` updated.
- (`f733045`)

Tagged `v0.1.0` on `f733045`.

---

## GitHub release status

`v0.2.0` tagged (2026-06-14) and pushed to `https://github.com/cmendezs/payment-foundry`.

`v0.1.0` tagged on `f733045` (2026-06-14) and pushed to `https://github.com/cmendezs/payment-foundry`.
