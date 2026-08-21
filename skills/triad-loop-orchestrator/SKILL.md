---
name: triad-loop-orchestrator
description: Coordinate a Triad+ Engineering Loop from declared feature cards through development, independent review, evidence-based state transitions, commits, normal pushes, multi-repository integration, delivery, and owner-controlled demos. Use when operating an initialized triad project workspace.
---

# Triad Loop Orchestrator

Own the process, not routine implementation or review. Read `project.yaml`, the
PRD baseline, `.loop/decision-policy.md`, the queue, and current state first.
When `.triad-plus/team.json` exists in the control workspace, also read it and
use its language, owner address, display names, and model contract for
communication. Its display names never change technical role authority.

## Verify and select work

1. Verify the PRD SHA-256, declared branch/worktree, repository instructions,
   runnable gates, and the current runtime capability snapshot.
2. Select one highest-priority `ready` card with approved dependencies.
3. Mark it `in_progress` and append an attempt before delegation.
4. Give the developer only the relevant card, PRD excerpt, instructions, gates,
   known risks, and allowed change surface.

## Apply the loop

Require developer evidence: changed files, tests, exact command results,
metrics, and unresolved risks. When external verification is configured, create
an immutable dispatch record under `.loop/runtime/assignments/<agent-id>.json`
before delegation. Bind it to the active card/attempt, worktree, expected PRD,
card and gate hashes, and expected verification run ID.

After the developer completes, move only to `verifying`. Read the recorded
`verification.selected_mode`: for `async_hook` or `hook_dispatch`, wait for the
external runner's atomic `verification.json` under the watchdog; for `explicit_dispatch`, invoke
the declared verifier command yourself with the assignment's agent identity,
then wait for the same atomic evidence. Re-detect capabilities at resume and
before a new dispatch when the CLI or hook configuration changed; append a new
snapshot instead of overwriting the old one. Never accept a developer claim as the
authoritative result of a `control-plane` gate. Validate run ID, feature,
attempt, assignment, PRD/card/gate hashes, and candidate fingerprint against the
active worktree. Reject stale, missing, invalid-context, failed, timed-out, or
invalidated evidence. A watchdog expiry in `async_hook` or `hook_dispatch` records
`verification_hook_missing` or `verification_timeout`; an explicit dispatch
failure records `verification_infrastructure_error`. Neither advances the card.

If optimization is `none`, valid passing verification moves to `in_review`. For
`gauntlet`, build an auditable minimal evaluation packet containing only feature
outcome, snapshotted quality bar, candidate artifact/observation instructions,
and valid verification summary. Exclude developer reports, reasoning, historic
attempts, prior evaluation/review findings, and improvement narrative. Dispatch
a new evaluator context—never resume or fork a developer/evaluator context.

Record the evaluator result only when its candidate fingerprint and quality-bar
hash match the active artifacts:

- `candidate_wins`: move to `in_review`;
- `bar_wins`: require exactly one largest gap, append it, and move to
  `quality_rework`; assign only that bounded repair to the developer;
- `indeterminate`: retry with a new fresh evaluator up to declared policy, then
  block with `evaluator_indeterminate` if observation remains unavailable.

Detect plateau from recorded observable evidence, not a numeric LLM score: a
repeated largest-gap fingerprint, no closed observable dimension within the
window, below-threshold objective delta, or fresh evaluators converging on the
same substantive gap. Enforce elapsed/budget/safety limits. For aspirational
bars, record stop and residual gap then enter review. For required bars, block
unless the owner explicitly waives the quality boundary.

Give the final reviewer the card, diff, developer report, verification evidence,
evaluation trail, stop/residual-gap evidence, and failure history. Record its
independent recommendation and make the workflow transition:

- `approved`: verify scope and evidence, commit the card locally, record its
  SHA, and select the next ready item;
- `rework`: preserve the finding and return the same card to development;
- `blocked`: record the exact decision required and escalate only when it would
  change product intent, criteria, metrics, gates, architecture, security,
  budget, or accepted risk.

Resolve ordinary developer-reviewer disagreements from evidence and record both
positions, the decision, and rationale. Do not delegate this authority upward.

Every patch after accepted verification invalidates prior verification and
evaluation evidence. A reviewer `rework` returns the card to `in_progress`; the
new artifact must traverse verification and, when enabled, a fresh evaluation.

## Exceptions

Delegate development and review by default. Perform a bounded hands-on task only
when the assigned role is unavailable or the harness cannot otherwise proceed.
Record trigger, failed delegation, scope, alternatives, risk, validation,
independent-review evidence, and restoration of ordinary roles. An orchestrator
review cannot replace independent review without an explicit owner waiver.

## Delivery

After all required cards and project gates pass, create one local commit per
approved card if not already recorded, then normally push every declared project
branch. Never force-push or create/update a pull request, publish a package,
change a registry version, or create a release without explicit owner direction.

Write a final handoff with card decisions, branches and commits, push evidence,
gate results, candidate fingerprints, quality-bar identities/hashes, verification
run count, evaluation rounds, largest gaps addressed, quality stop/residual gap,
risks, exception audit, and integration evidence. A delivered handoff is
immutable evidence.

## Integration and demos

For enabled multi-repository integration, run the final integration card after
component cards are approved. Use declared local worktrees and setup commands,
record the exact branch/commit map, prove data/event/callback behavior, and
require independent review.

If a demo is declared, report it `ready_to_start` at delivery. Start it only on
the owner's explicit request, verify local and remote access, record process
group and URL, and keep it running until the owner explicitly ends the demo.
Stop only that recorded process group and verify port release. Do not use an
automatic time-to-live or displace unrelated processes or routes.

## Feedback

Record post-delivery feedback without rewriting the handoff. A defect inside
declared scope creates a follow-up card; new behavior or a changed objective
creates a successor project with only missing measurable conditions requested.
