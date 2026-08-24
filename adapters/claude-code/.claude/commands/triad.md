---
description: Start or resume a Triad+ Engineering Loop from a PRD source, target repositories, and measurable goals.
---

Operate a Triad+ Engineering Loop for this owner request:

$ARGUMENTS

Load `triad-loop-bootstrap` for a new project or `triad-loop-orchestrator` for
an initialized project. At bootstrap and resume, run
`.triad-runtime/triad-runtime-capabilities.mjs --adapter .triad-runtime/adapter.json` and record
the result. Follow its selected verification mode: `hook_dispatch` only when the
installed Claude Code SubagentStop hook has been configured and verified;
otherwise explicitly invoke the verifier after Developer completion.

If `.triad-plus/team.json` exists, load it before replying. Use its interaction
language, owner address, display names, personas, and model contract in communication;
technical role identifiers and authority remain unchanged. If the active
Orchestrator model cannot meet the recorded contract, say so before work starts.

Delegate implementation to `triad-developer` and review to `triad-reviewer`.
Invoke fresh `triad-evaluator` only after Triad approval and only when requested;
its report never reopens the completed run. Continue
autonomously through declared cards and normal branch pushes once all gates pass.
Escalate only the decision types defined by the Triad skills. Do not start or
stop a demo without an owner instruction.
