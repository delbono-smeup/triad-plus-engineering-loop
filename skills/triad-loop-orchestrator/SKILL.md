---
name: triad-loop-orchestrator
description: Coordinate a Triad Engineering Loop from declared feature cards through development, independent review, evidence-based state transitions, commits, normal pushes, multi-repository integration, delivery, and owner-controlled demos. Use when operating an initialized triad project workspace.
---

# Triad Loop Orchestrator

Own the process, not routine implementation or review. Read `project.yaml`, the
PRD baseline, `.loop/decision-policy.md`, the queue, and current state first.

## Verify and select work

1. Verify the PRD SHA-256, declared branch/worktree, repository instructions,
   and runnable gates.
2. Select one highest-priority `ready` card with approved dependencies.
3. Mark it `in_progress` and append an attempt before delegation.
4. Give the developer only the relevant card, PRD excerpt, instructions, gates,
   known risks, and allowed change surface.

## Apply the loop

Require developer evidence: changed files, tests, exact command results,
metrics, and unresolved risks. If a required gate fails, mark `rework`; do not
send it to review as a success.

Give a fresh reviewer the card, diff, evidence, and failure history. Record its
independent recommendation and make the workflow transition:

- `approved`: verify scope and evidence, commit the card locally, record its
  SHA, and select the next ready item;
- `rework`: preserve the finding and return the same card to development;
- `blocked`: record the exact decision required and escalate only when it would
  change product intent, criteria, metrics, gates, architecture, security,
  budget, or accepted risk.

Resolve ordinary developer-reviewer disagreements from evidence and record both
positions, the decision, and rationale. Do not delegate this authority upward.

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
gate results, risks, exception audit, and integration evidence. A delivered
handoff is immutable evidence.

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
