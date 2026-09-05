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

## Optional deterministic candidate scope

Cards may add a versioned JSON scope contract, bound by path and SHA-256 in the
Developer assignment. The contract names repository-relative `allowed_paths`,
optional `allowed_incidental_paths`, and `forbidden_paths` for each target
repository. It uses a small glob syntax: `*` does not cross a directory,
`**` may cross directories, and `?` matches one non-separator character.

For a scope-bound card, the Orchestrator captures a clean card baseline commit
before the first assignment and reuses it for every rework attempt. The verifier
compares the full cumulative candidate delta against that baseline before running
expensive gates. It records changed paths and offending paths in evidence. A
scope failure skips expensive gates and Reviewer dispatch; it is bounded
`scope_cleanup`, not approval. A card without a scope contract records
`scope_not_configured` and retains legacy behavior.

Package manifests and lockfiles require an explicit `allowed_incidental_paths`
entry. Snapshot patterns must be narrow; broad `snapshots/**` contracts are
rejected. A scope pass is only a deterministic path check: Reviewer remains
mandatory for semantic scope, correctness, design, and risk.

## Codex dispatch modes

Codex uses `explicit_dispatch` by default, including when a compatible async
`SubagentStop` hook is installed. This is the directly auditable path used for
normal unattended progress. The async hook remains supported as an experimental
opt-in with `requested_mode=async_hook`; it is selected only when the requested
hook is valid and available. If that requested hook is unavailable, capability
detection fails safe to `explicit_dispatch` and records the reason.

Hooks may produce evidence; the Orchestrator governs progress. The hook never
dispatches a Reviewer, selects a card, reopens a run, or performs repair.
