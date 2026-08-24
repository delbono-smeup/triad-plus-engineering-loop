---
name: triad-loop-bootstrap
description: Create an isolated Triad project-control workspace from a PRD, including a frozen PRD baseline, manifest, feature plan, core work queue, verification templates, and delivery evidence templates. Use before the Orchestrator starts a new software initiative.
---

# Triad Bootstrap

Create the project-control workspace outside product repositories. It is the
human/agent record of planning and evidence; it is not an executable workflow
engine.

Collect only missing essentials: project ID/title, readable PRD source, target
repositories with base/project branches and worktrees, measurable success
conditions, runnable quality gates, practical-test need, and integration need.

1. Create `<control-repository>/projects/<project-id>/`.
2. Copy `assets/project.yaml` to `project.yaml`; register only declared product
   repositories, branches, and worktrees.
3. Copy the approved PRD to `artifacts/prd.md`; record source, collection time,
   snapshot, revision when available, and SHA-256.
4. Copy `assets/loop-template/` to `.loop/`, then create bounded feature cards
   under `features/` and a complete `feature-plan.md`.
5. Replace every gate placeholder. Gate executors in v1 are only
   `control-plane`; remove a non-applicable gate with a recorded reason instead
   of declaring manual or MCP execution.
6. Create `.loop/runtime/assignments/` and record the active adapter metadata in
   `.loop/runtime/capabilities.json` by running
   `.triad-runtime/triad-runtime-capabilities.mjs --adapter
   .triad-runtime/adapter.json`.
7. Show the full card division before delivery work. Continue unless the owner
   changes it or an escalation condition exists.

The normal state route is `draft → ready → in_progress → verifying → in_review
→ approved|rework|blocked`. The Orchestrator owns those records. Before each
Developer dispatch, write an active assignment with a unique assignment ID,
feature, attempt, expected branch, worktree, PRD/card/gate hashes, and verifier
run ID. The verifier produces environment-derived evidence; it never changes
card state.

Use local worktrees for enabled multi-repository integration and declare a final
integration card. Do not publish packages, alter registry versions, or create a
release as a bootstrap/integration step. Re-baseline only after an explicit owner
requirement change; preserve the previous PRD snapshot and record both hashes.
