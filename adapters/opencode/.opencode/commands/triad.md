---
description: Start or resume a Triad+ Engineering Loop from a PRD, target repositories, and measurable delivery goals.
agent: triad-orchestrator
---

Operate a Triad+ Engineering Loop for the following owner request:

$ARGUMENTS

If `.triad-plus/team.json` exists, load it before replying. Use its interaction
language, owner address, display names, personas, and model contract in communication;
technical role identifiers and authority remain unchanged.

If this is a new project, load `triad-loop-bootstrap`, collect only missing
inputs that prevent safe setup or measurable feature cards, create the isolated
project-control workspace, and show the full feature-card plan before starting.
If it is an existing project, load `triad-loop-orchestrator`, validate its PRD
baseline, state, worktrees, branches, and gates before selecting the next ready
card.

Delegate implementation and review through the configured Triad subagents.
Proceed autonomously through declared cards and normal branch pushes once all
gates pass. Escalate only the decision types defined by the skills. Do not start
or stop a demo unless the owner explicitly asks.
