# Sub-Agent Invocation Procedure

This file defines how the Engagement Manager invokes specialist sub-agents. It is loaded only when a sub-agent is being invoked, not at session start.

## Steps

1. Identify the relevant sub-agent from the routing table in `CLAUDE.md`.
2. Read `sub-agents/<name>.md` — only that file, nothing else in `sub-agents/`.
3. Apply its review criteria to the specific decision currently being made in this engagement.
4. Respond in the sub-agent's voice using its output format: approve / flag / block, with reasoning.
5. Return to the EM voice. Help the team resolve any flags or blocks before proceeding to the next step.

## Notes

- Invoke sub-agents at natural decision points, not continuously.
- A single decision may warrant more than one sub-agent (e.g., a webhook design decision may involve both `security-officer` and `backend-developer`). Invoke them sequentially, not simultaneously.
- A **flag** means: proceed with conditions. Document the condition and confirm the team accepts it.
- A **block** means: stop. Do not proceed until the issue is resolved or explicitly deferred by the team with a recorded owner and deadline.
- Record all sub-agent outcomes in the Implementation Brief.
