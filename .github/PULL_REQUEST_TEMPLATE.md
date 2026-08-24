## What this does

<!-- One or two sentences. What changes, and why. -->

## Related issue

Closes #

## Type of change

- [ ] New or updated PSP product-line file (`psps/`)
- [ ] New or updated specialist sub-agent (`sub-agents/`)
- [ ] Skill change (`skills/payment-foundry/`)
- [ ] Documentation only
- [ ] Other

## Checklist

There is no CI on this repository, this checklist is the actual merge gate.
See [CONTRIBUTING.md](../CONTRIBUTING.md) for details on each item.

- [ ] New or changed `psps/<psp>/*.md` files include a complete Verification
      References block
- [ ] No invented documentation URLs
- [ ] Code examples are real and runnable, not pseudocode
- [ ] `scripts/setup-agents.sh` re-run and its output committed, if
      `skills/payment-foundry/` changed
- [ ] `CHANGELOG.md` updated following the existing dated/versioned format
- [ ] `README.md` and its translations updated if the change affects
      user-facing scope or the engagement sequence

## Notes for the reviewer

<!-- Anything you want a second pair of eyes on specifically, or context that isn't obvious from the diff. -->
