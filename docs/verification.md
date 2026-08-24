# Verification and evidence

An agent-reported claim is not the same as verification evidence. A Developer can
report the commands it ran; `triad-verify` independently observes declared
required `control-plane` gates and writes atomic evidence.

Before gates run, the verifier validates the active assignment, PRD/card/gate
hashes, worktree, expected branch, and candidate fingerprint. It records the
assignment ID/hash and run ID, executes deterministic commands with a bounded
timeout, and invalidates evidence if the candidate changes while gates run.

Only `control-plane` gate executors are supported in v1. A required unsupported
executor fails closed. Verifier evidence informs the Reviewer and Orchestrator;
it does not itself approve, rework, or transition a run.

Evidence files and logs are diagnostics. Users normally need only the
Orchestrator's summary and the Reviewer verdict.
