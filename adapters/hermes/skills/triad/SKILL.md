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
ordinary implementation with `hermes chat -q --in <worktree> --no-restore-cwd`
using `--skills triad-loop-developer`; obtain a separate Reviewer result with
`--skills triad-loop-reviewer`. Hermes terminal sessions may retain a profile
default directory, so every terminal call must explicitly set its `workdir` to
the declared worktree; file operations must use that same worktree. Give each invocation only its declared role
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
post-run report at the absolute `<control-workspace>/artifacts/evaluator-plus/`
path supplied by the Orchestrator; never infer it relative to a product worktree.
`FAIL` or `INDETERMINATE` is information for a new
owner-requested run, never an automatic repair.
