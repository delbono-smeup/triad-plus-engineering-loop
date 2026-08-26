# Verification and evidence

## Repository skill bindings

When a target repository declares a skill router, the Orchestrator binds the
router, routed task skills, and completion skill to the Developer assignment as
worktree-relative paths and SHA-256 values. `triad-verify` checks that every
declared skill exists inside the declared worktree and still matches its bound
hash, then records the result in environment-derived verification evidence.

This proves the exact repository skill policy available to the attempt; it does
not claim to observe an LLM's private reasoning. Developer, Reviewer, and
Evaluator+ must separately report their use of the same bound skills, so a
missing or inconsistent attestation is visible to the Orchestrator.

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

## Codex dispatch modes

Codex uses `explicit_dispatch` by default, including when a compatible async
`SubagentStop` hook is installed. This is the directly auditable path used for
normal unattended progress. The async hook remains supported as an experimental
opt-in with `requested_mode=async_hook`; it is selected only when the requested
hook is valid and available. If that requested hook is unavailable, capability
detection fails safe to `explicit_dispatch` and records the reason.

Hooks may produce evidence; the Orchestrator governs progress. The hook never
dispatches a Reviewer, selects a card, reopens a run, or performs repair.
