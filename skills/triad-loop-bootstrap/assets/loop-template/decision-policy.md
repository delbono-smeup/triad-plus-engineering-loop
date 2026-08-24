# Triad decision policy

| Current state | Next state | Owner | Required basis |
| --- | --- | --- | --- |
| `draft` | `ready` | Orchestrator | Complete card, declared plan, runnable gates. |
| `ready` | `in_progress` | Orchestrator | Dependencies approved and new attempt recorded. |
| `in_progress` | `verifying` | Orchestrator | Developer leaves a bounded candidate. |
| `verifying` | `in_review` | Orchestrator | Current passing environment-derived verifier evidence. |
| `verifying` | `rework` | Orchestrator | Failed, stale, missing, invalid, timed-out, or invalidated evidence. |
| `in_review` | `approved` | Orchestrator | Reviewer approves against current evidence. |
| `in_review` | `rework` | Orchestrator | Reviewer gives bounded actionable findings. |
| active state | `blocked` | Orchestrator | Material owner decision or external blocker. |
| `blocked` | `ready` or `deferred` | Orchestrator | Owner records the required decision. |

Only the Orchestrator records transitions. The verifier writes evidence only.
Developer and Reviewer reports are agent-reported claims; a `control-plane` gate
is authoritative only through matching verifier evidence. Every new patch needs
a new verifier run. Stop automatic retry at the declared limit and record the
owner decision needed. Normal delivery requires all non-deferred cards approved,
project gates passed, one local commit per approved card, and declared branches
pushed. Pull requests, releases, publication, force pushes, and demo start/stop
remain owner decisions.
