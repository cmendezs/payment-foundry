# Installation Guide

Run through this once when setting up payment-foundry for a new engagement workspace.

## 1. Install Claude Code

```bash
curl -fsSL https://claude.ai/install.sh | bash

# Verify installation
claude --version
```

## 2. Get the workspace

Clone or copy this `payment-foundry` directory, then open a terminal in it.

## 3. Set up local environment

```bash
cp .env.example .env
```

Fill in `.env` with your Stripe test mode keys. See `setup/environment-keys.md` for where to find them. `.env` is gitignored and never committed.

## 4. Launch Claude Code

```bash
claude
```

Claude Code reads `CLAUDE.md` automatically and loads the Engagement Manager persona.

## 5. (Optional) Connect MCPs

payment-foundry works fully from local files, no MCP is required. If you want Claude to query Stripe data directly during a session (e.g., look up an account, a payment intent, recent webhook events), you can connect the Stripe MCP server:

```bash
claude mcp add --transport http stripe https://mcp.stripe.com
```

After adding it, Claude will be prompted to authenticate. Once connected, Claude can use it to look up live objects in your Stripe test account when relevant. This is optional, everything in `psps/stripe/` works without it.

During an engagement, the `solution-architect` sub-agent uses this connection to check feature GA/beta status, the Stripe API Changelog, and the connected account's actual capabilities, rather than relying on the static guidance in `psps/stripe/`. If the MCP is not connected, the team will see those points marked `[Unverified]` with a pointer to confirm against `stripe.com/docs`.

### Local Stripe MCP server (alternative)

If you prefer or need a local setup, run the [local Stripe MCP server](https://github.com/stripe/ai/tree/main/tools/modelcontextprotocol).

Add the following to your `claude_desktop_config.json`. For more details, see the [Claude Desktop documentation](https://modelcontextprotocol.io/quickstart/user).

```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp@latest"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
      }
    }
  }
}
```

## 6. Run the first session checklist

Go through `setup/first-session-checklist.md`, then run:

```
/start-session
```

inside Claude Code.
