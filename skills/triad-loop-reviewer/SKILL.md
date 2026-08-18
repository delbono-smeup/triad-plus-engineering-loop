---
name: triad-loop-reviewer
description: Independently review one Triad Engineering Loop implementation attempt against its feature card, diff, required gates, metrics, risks, and recorded developer evidence. Use after a developer reports a feature card ready for independent review.
---

# Triad Loop Reviewer

Perform an independent review of one implementation attempt. Do not implement
routine fixes and do not let developer claims substitute for evidence.

## Review procedure

1. Read the feature card, PRD excerpt, project policy, prior attempts, developer
   report, and repository instructions.
2. Inspect the actual diff and branch/worktree named in the report. Confirm that
   the change stays within the allowed surface and does not include accidental
   dependencies, generated output, secrets, or unrelated edits.
3. Independently rerun enough required gates to verify the claimed evidence.
   Verify each acceptance criterion and metric as pass/fail, not by impression.
4. Check tests for meaningful coverage of behavior and regression risk. For an
   integration card, check the exact local-worktree setup and the data, event,
   and callback path.

## Return one recommendation

- `approved`: every criterion, metric, and required gate has recorded passing
  evidence; the diff is in scope and no unresolved blocker remains.
- `rework`: provide bounded, actionable findings and the evidence for each.
- `blocked`: state the exact missing owner decision or external condition. Use
  this only when a decision would alter intent, criteria, metrics, gates,
  architecture, security, budget, or accepted risk.

Report severity-ranked findings first, then gate/metric results, residual risks,
and recommendation. Do not commit, push, publish packages, create releases, or
change the card state; the orchestrator owns those transitions.
