#!/usr/bin/env python3
"""Generate docs/public/llms.txt from in-repo sources only. Run from docs/:

    python scripts/gen_llms_txt.py            # write public/llms.txt
    python scripts/gen_llms_txt.py --check    # exit 1 if public/llms.txt is stale
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

DOCS_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_ROOT = DOCS_ROOT.parent
OUTPUT = DOCS_ROOT / "public" / "llms.txt"
PAGES_BASE = "https://cmendezs.github.io"

# Payment Foundry has no package.json/pyproject.toml at the repo root — it is an
# agent-instructions template, not a published package — so name/description/version
# are read straight from the README and CHANGELOG rather than a manifest.


def _read_readme() -> dict[str, str]:
    path = PACKAGE_ROOT / "README.md"
    if not path.is_file():
        raise SystemExit(f"no README.md found at {path}")
    lines = path.read_text(encoding="utf-8").splitlines()
    name = None
    description = None
    for line in lines:
        stripped = line.strip()
        if name is None:
            m = re.match(r"^#\s+(.+)$", stripped)
            if m:
                name = m.group(1).strip()
            continue
        if not stripped or stripped == "---" or stripped.startswith("["):
            continue
        description = stripped
        break
    if not name or not description:
        raise SystemExit("README.md must have a leading '# Title' and a one-line description")
    return {"name": name, "description": description}


def _repo_name() -> str:
    # Fixed rather than derived from the checkout directory name: matches the `base` path
    # hardcoded in docs/astro.config.mjs, and stays correct when built from a worktree whose
    # directory name isn't the repo name.
    return "payment-foundry"


def _render(readme: dict[str, str], repo: str) -> str:
    base = f"{PAGES_BASE}/{repo}/"
    lines: list[str] = [
        f"# {readme['name']}",
        "",
        f"> {readme['description']}",
        "",
        "## Docs",
        "",
        f"- [Overview]({base}): the full README",
        f"- [Changelog]({base}changelog/): version history",
        f"- [Contributing]({base}contributing/): dev setup and PR checklist",
        f"- [Security]({base}security/): vulnerability disclosure policy",
        f"- [Code of Conduct]({base}code-of-conduct/): community standards",
        f"- [Support]({base}support/): where to ask questions and get help",
        "",
        "## Links",
        "",
        f"- [GitHub](https://github.com/cmendezs/{repo})",
    ]
    return "\n".join(lines).rstrip() + "\n"


def _generate() -> str:
    readme = _read_readme()
    return _render(readme, _repo_name())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    content = _generate()
    if args.check:
        existing = OUTPUT.read_text(encoding="utf-8") if OUTPUT.is_file() else ""
        if existing != content:
            print(f"{OUTPUT.relative_to(PACKAGE_ROOT)} is out of date. Run without --check.", file=sys.stderr)
            return 1
        print(f"{OUTPUT.relative_to(PACKAGE_ROOT)} is up to date.")
        return 0
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(content, encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(PACKAGE_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
