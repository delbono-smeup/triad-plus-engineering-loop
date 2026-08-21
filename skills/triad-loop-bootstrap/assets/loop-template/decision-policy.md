# Decision policy

## State transitions

| Current state | Evidence | Next state | Owner |
| --- | --- | --- | --- |
| `draft` | complete card, declared plan, configured gates | `ready` | orchestrator |
| `ready` | dependencies approved | `in_progress` | orchestrator |
| `in_progress` | developer completes its bounded attempt | `verifying` | orchestrator |
| `verifying` | valid current-fingerprint required-gate evidence passes, optimization `none` | `in_review` | orchestrator |
| `verifying` | valid current-fingerprint required-gate evidence passes, optimization `gauntlet` | `evaluating` | orchestrator |
| `verifying` | a required gate fails | `rework` | orchestrator |
| `verifying` | evidence missing, stale, invalid, or infrastructure fails | `verification_error` or `blocked` | orchestrator |
| `evaluating` | fresh evaluator returns `candidate_wins` | `in_review` | orchestrator |
| `evaluating` | fresh evaluator returns `bar_wins` | `quality_rework` | orchestrator |
| `evaluating` | indeterminate evaluation | `evaluator_retry` or `blocked` | orchestrator |
| `evaluating` | aspirational plateau/budget/safety stop | `in_review` with residual gap | orchestrator |
| `evaluating` | required plateau/budget/safety stop | `blocked` | orchestrator |
| `quality_rework` | one bounded repair is assigned | `in_progress` | orchestrator |
| `in_review` | independent reviewer verifies all evidence | `approved` | orchestrator |
| `in_review` | reviewer identifies a bounded fix | `rework` | orchestrator |
| active state | material ambiguity or required external decision | `blocked` | orchestrator |
| `blocked` | owner records the needed decision | `ready` or `deferred` | orchestrator |

An item is approved only when every acceptance criterion, metric, and required
gate has passing evidence on the actual declared branch/worktree; the review is
independent; the change remains in scope; and no unresolved blocker, security
issue, or accidental dependency remains.

## Verification and Gauntlet

The developer may run local checks, but a configured `control-plane` gate is
authoritative only through immutable verification evidence produced by the
external runner. The runner never changes card state. The orchestrator accepts
evidence only when feature, attempt, PRD/card/gates hashes, and candidate
fingerprint all match the active assignment. A patch after verification
invalidates both verification and evaluation evidence.

For `optimization.mode: gauntlet`, snapshot the declared quality bar and use a
fresh evaluator with an auditable packet that excludes developer narrative and
prior evaluation/review history. `bar_wins` must contain exactly one largest
remaining gap and a bounded repair. The evaluator never approves delivery.

At least one quality-loop safety limit is required. Record one stop reason:
`quality_bar_won`, `plateau`, `budget_exhausted`,
`safety_iteration_ceiling`, `owner_stop`, or `external_blocker`. A required bar
blocks on a non-winning stop absent an owner waiver. An aspirational bar may
enter review with the residual gap and stop evidence preserved.

Failures are never approval: `verification_gate_failed`,
`verification_context_invalid`, `verification_timeout`,
`verification_hook_missing`, `verification_infrastructure_error`,
`candidate_changed_after_verification`, `evaluator_unavailable`,
`evaluator_indeterminate`, `quality_bar_missing`, `quality_bar_changed`,
`quality_plateau`, `quality_budget_exhausted`, and `developer_aborted` must be
recorded as product, quality, infrastructure, or owner-decision failures.

## Retry and arbitration

Increment an item's attempt count for rework. At the configured retry limit,
stop automatic retries and record the exact owner decision needed. Never convert
a failed or unavailable required gate into a pass without an explicit waiver.

The orchestrator resolves ordinary developer-reviewer disagreement from the PRD,
card, policy, and evidence. Record both positions, evidence, decision, and
rationale. Escalate only when a resolution changes product intent, acceptance
criteria, metrics, required gates, architecture, security, budget, or accepted
risk.

## Exceptions

The orchestrator delegates implementation and review by default. A bounded
hands-on exception must record trigger, failed delegation, scope, alternatives,
risk, validation, independent-review evidence, and return to ordinary roles.
The delivery handoff reports every exception and a zero count when none occurred.

## Delivery and feedback

Delivery requires all non-deferred cards approved, all project gates passed, and
every deferred item covered by an owner decision. Each approved card has one
local commit. The orchestrator normally pushes declared project branches after
delivery checks pass. Pull requests, force pushes, package publication, registry
version changes, and releases are never automatic actions.

A delivered handoff is final evidence. Post-delivery defects inside scope become
follow-up cards. New objectives become successor projects. Never rewrite the
delivered cards, approvals, reviews, commits, or decision.

## PRD, integration, and demos

Verify `project.prd_baseline.sha256` before every cycle. A mismatch blocks work
until the owner restores or explicitly re-baselines the PRD, preserving the old
snapshot and recording the change.

Enabled integration requires a final approved `local-worktrees` card with exact
consumer/provider branch and commit evidence and passing integration gates.

An enabled demo is `ready_to_start` after delivery. Start only on owner request,
verify local and remote access, and record the process group. Stop only that
group after owner completion; do not use an automatic TTL.
