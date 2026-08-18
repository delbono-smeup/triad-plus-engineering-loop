# Decision policy

## State transitions

| Current state | Evidence | Next state | Owner |
| --- | --- | --- | --- |
| `draft` | complete card, declared plan, configured gates | `ready` | orchestrator |
| `ready` | dependencies approved | `in_progress` | orchestrator |
| `in_progress` | developer gates pass | `in_review` | orchestrator |
| `in_progress` | a required gate fails | `rework` | orchestrator |
| `in_review` | independent reviewer verifies all evidence | `approved` | orchestrator |
| `in_review` | reviewer identifies a bounded fix | `rework` | orchestrator |
| active state | material ambiguity or required external decision | `blocked` | orchestrator |
| `blocked` | owner records the needed decision | `ready` or `deferred` | orchestrator |

An item is approved only when every acceptance criterion, metric, and required
gate has passing evidence on the actual declared branch/worktree; the review is
independent; the change remains in scope; and no unresolved blocker, security
issue, or accidental dependency remains.

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
