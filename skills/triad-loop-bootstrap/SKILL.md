---
name: triad-loop-bootstrap
description: Create an isolated Triad Engineering Loop project from a PRD, including an immutable PRD baseline, feature plan, project manifest, work queue, and evidence templates. Use when starting a new software initiative outside product repositories, when one initiative targets multiple repositories, or before invoking triad-loop-orchestrator.
---

# Triad Loop Bootstrap

Create the project-control workspace before implementation begins. Keep it
outside every product repository and use it as the source of truth for planning,
state, evidence, and delivery records.

## Required inputs

Collect only missing essentials: project ID and title, readable PRD source,
target repositories with base and project branches, measurable success
conditions, quality gates, demo need, and local-worktree integration need. Ask
only when an omission prevents a measurable card or safe branch/worktree setup.
Do not request approval merely to present a plan.

## Create the workspace

1. Create `<control-repository>/projects/<project-id>/` outside target product
   repositories.
2. Copy `assets/project.yaml` to `project.yaml` and fill the manifest.
3. Copy the approved PRD to `artifacts/prd.md`. Record source, collection time,
   SHA-256, snapshot path, and source revision when available under
   `project.prd_baseline`.
4. Copy `assets/loop-template/` to `.loop/`.
5. Register each product repository only in `project.yaml`, with a distinct
   branch and project-local worktree path. Never use the base branch as the
   project branch.
6. Replace gate placeholders, write bounded feature cards, and create a full
   `feature-plan.md` from the template.
7. Show the complete card division—outcomes, dependencies, repositories,
   metrics, gates, and practical-test scenarios—then record it as declared and
   continue unless the owner changes it or an escalation condition exists.

## Multi-repository projects

When repositories exchange data, events, callbacks, services, or component
libraries, set `project.integration.enabled: true` and use only
`local-worktrees`. Declare one final integration card that depends on every
component card. Name consumer and provider worktrees, local setup/link commands,
data/event/callback criteria, and integration gates. Do not publish packages,
modify registry versions, or create releases as a bootstrap or integration step.

## Verify before starting

Verify all YAML files, the PRD snapshot hash, repository paths, branch names,
worktree paths, repository-local instructions, and runnable gates. Record the
result in `.loop/run-state.yaml`, select exactly one dependency-free item as
`ready`, then invoke `$triad-loop-orchestrator`.

## Re-baseline procedure

Re-baseline only when the owner explicitly changes the operational PRD. Preserve
the previous snapshot under `artifacts/prd-baselines/`, import the new approved
snapshot, update source and SHA-256 metadata, and append the reason, old/new
hashes, source revisions, and affected cards to `prd_rebaselines`. If goals,
metrics, or criteria change, update and show the feature plan before continuing.

## Guardrails

- Do not put PRDs, queues, reviews, handoffs, product source, worktrees,
  credentials, dependency directories, or `.env` files in the wrong repository.
- Do not silently refresh the PRD snapshot from its external source.
- Do not create, switch, reset, merge, delete, or push an undeclared branch.
- Do not start developer or reviewer work without a complete card and runnable
  required gates.
