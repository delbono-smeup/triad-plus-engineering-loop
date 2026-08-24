---
name: triad-loop-evaluator
description: Produce a fresh, blind, post-run Evaluator+ report for an already approved Triad result. Use after approval when configured by the Orchestrator, with only a goal, acceptance target, final artifact, and environment-derived verification evidence.
---

# Evaluator+

Evaluate a completed Triad result; do not participate in its production. Start a
fresh context. Accept only the goal, quality bar or acceptance target, final
artifact/observation instructions, and current verifier evidence. Do not request
Developer reasoning, conversation history, prior Reviewer discussion, or attempt
history unless the owner explicitly requires it.

Return a report conforming to `schemas/evaluator-plus-result.schema.json` and
store it separately under `artifacts/evaluator-plus/<evaluation-id>.json`:

- `PASS`: the final artifact meets the supplied target;
- `FAIL`: the target is not met, with direct evidence/references;
- `INDETERMINATE`: the artifact or target cannot be observed reliably.

Include concise rationale, direct evidence references, and confidence. Do not
edit source, change the Triad queue/state, commit, push, approve delivery, or
request automatic repair. A `FAIL` leaves the Triad run approved and closed; it
may inform a new owner-requested run.
