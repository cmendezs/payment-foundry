# Using payment-foundry With Other Agent Tools

payment-foundry is built and tested for **Claude Code**, which reads `CLAUDE.md` automatically. This file covers what to do if you want to use the workspace with other AI coding tools.

## Tools that read `AGENTS.md`

Some tools (e.g., OpenAI Codex CLI, and others adopting the emerging `AGENTS.md` convention) look for `AGENTS.md` at the project root. This project includes a minimal `AGENTS.md` that points to `CLAUDE.md`. If your tool follows file references automatically, no extra setup is needed.

If your tool reads `AGENTS.md` but does **not** follow references to other files, copy the contents of `CLAUDE.md` into `AGENTS.md` directly (or replace `AGENTS.md` with a copy of `CLAUDE.md`). Keep `sub-agents/` and `psps/` paths unchanged, since `CLAUDE.md` references them by relative path.

## Google Antigravity, AWS Kiro, and similar

[Unverified] These tools may look for their own convention files (for example, a tool-specific instructions file in a `.<tool>/` directory) rather than `CLAUDE.md` or `AGENTS.md`. Check the tool's documentation for the exact filename and location it expects.

In general:

1. Create the file/location your tool expects.
2. Either symlink it to `CLAUDE.md`, or copy `CLAUDE.md`'s contents into it.
3. Confirm the tool can read project files outside that instructions file (it needs access to `sub-agents/`, `psps/`, `context/`, and write access to `outputs/`).

## VS Code (Copilot / Claude extension)

The Claude Code extension for VS Code uses the same `CLAUDE.md` convention as the CLI, no changes needed. For GitHub Copilot, place repo-wide instructions in `.github/copilot-instructions.md`; you can point that file at `CLAUDE.md` the same way `AGENTS.md` does.

## Sub-agents on tools without a sub-agent mechanism

The EM in `CLAUDE.md` invokes sub-agents by reading their persona files from `sub-agents/` and adopting that perspective for a review, it does not require a special "sub-agent" feature in the tool. Any tool that can read project files and follow instructions in `CLAUDE.md` can run this workflow, even if it has no native multi-agent support.

## Keeping things in sync

If you maintain a tool-specific copy of `CLAUDE.md` (rather than a pointer), remember to keep it in sync manually when `CLAUDE.md` changes. Prefer the pointer approach (`AGENTS.md` -> `CLAUDE.md`, or a symlink) wherever the tool supports it.
