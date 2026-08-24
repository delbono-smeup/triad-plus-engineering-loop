---
name: triad
description: Start or resume a Triad run in Hermes Agent from a PRD source, declared repositories, and measurable goals. Use when the owner invokes /triad or asks Hermes to coordinate a Triad project; use --evaluator only after an approved Triad run for an independent post-run Evaluator+ report.
---

# Triad in Hermes

Operate the current Hermes session as the Triad Orchestrator. Load
`triad-loop-bootstrap` for a new control workspace and
`triad-loop-orchestrator` for an initialized one. Read `.triad-plus/team.json`
when present; its role IDs, names, personas, and model/provider contract are
configuration, not workflow authority.

For a normal run, govern only Orchestrator, Developer, and Reviewer. Delegate
ordinary implementation with `hermes chat -q` in the declared worktree using
`--skills triad-loop-developer`; obtain a separate Reviewer result with
`--skills triad-loop-reviewer`. Give each invocation only its declared role
input, capture its output as an agent-reported claim, and make the binding
decision yourself from the card, worktree, and environment-derived verifier
evidence. Use the model/provider selected in `team.json` only when it is
available in Hermes; otherwise report the mismatch rather than substituting it.

After the Developer finishes, explicitly run
`.triad-runtime/triad-verify.mjs` with the active assignment. Hermes has no
Triad lifecycle hook in this adapter. A verifier pass is environment-derived
evidence; a Developer statement is not.

When invoked with `--evaluator`, do not reopen a Triad run. Load
`triad-loop-evaluator` in a fresh Hermes one-shot session with only the approved
goal, acceptance target, final artifact, and verification evidence. Store its
post-run report separately. `FAIL` or `INDETERMINATE` is information for a new
owner-requested run, never an automatic repair.
