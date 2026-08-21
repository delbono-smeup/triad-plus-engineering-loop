# Triad Engineering Loop: OpenCode Replication Guide

## Purpose

The Triad Engineering Loop is tool-neutral. This adapter connects its existing
five standard Agent Skills to OpenCode's project-local agent and command
configuration. It provides one primary orchestrator, three hidden subagents, and
the `/triad` entry command without placing any personal configuration, model
credentials, product source, worktrees, or delivery records in this repository.

The source files are under `adapters/opencode/`. Use the installer to copy them
and the five skills into the OpenCode configuration scope of your choice.

## Installation

For a project-control repository, clone this repository and run from its root:

```bash
./adapters/opencode/install.sh --project /path/to/project-control-repository
```

This creates or extends only the target's `.opencode/agents/`,
`.opencode/commands/`, and `.opencode/skills/` directories. The target is the
control repository: planning records and evidence live there; product
repositories remain declared targets in `project.yaml`.

For a personal installation shared by all local projects, run:

```bash
./adapters/opencode/install.sh --global
```

The installer refuses all name collisions before copying any files. This avoids
silently replacing a local customization. To update an existing installation,
review its local changes, deliberately remove or rename the Triad entries, and
run the installer again.

## Installed topology

| Installed file | OpenCode role | Method responsibility |
| --- | --- | --- |
| `agents/triad-orchestrator.md` | Primary agent | Governs state and decisions; delegates by default. |
| `agents/triad-developer.md` | Hidden subagent | Implements one bounded card and reports evidence. |
| `agents/triad-evaluator.md` | Hidden subagent | Freshly compares a verified candidate to a quality bar. |
| `agents/triad-reviewer.md` | Hidden subagent | Independently reviews without editing. |
| `commands/triad.md` | `/triad` command | Enters or resumes the loop through the orchestrator. |
| `skills/triad-loop-*/` | Standard Agent Skills | Shared process instructions and workspace templates. |

The orchestrator's task permission allows only the developer, evaluator, and
reviewer. The developer cannot call subagents. The evaluator and reviewer cannot
edit files or make routine fixes. All four may access external directories because the method operates
declared product worktrees outside the control repository; their prompts and
the project manifest restrict that access to the declared scope.

## Model routing

No provider or model is encoded in the adapter. This keeps the public package
portable and ensures that an installation never assumes access to a provider.
Without a `model` field, OpenCode uses its globally selected model for the
primary agent and normally inherits it for subagents.

To route roles independently, edit the three installed agent files and add a
provider-specific model field to each YAML frontmatter block:

```yaml
model: provider/model-id
```

Select a strong implementation model for `triad-developer` and reliable,
independent planning/evaluation/review models for the other roles. Consult
`opencode models` for the identifiers exposed by the configured providers. If a
role-specific model is unavailable, keep the default routing or explicitly
change the operational configuration before starting a real project; do not
silently substitute it mid-loop.

## Start and resume

Open the target control repository in OpenCode and enter:

```text
/triad <PRD location or project request>
```

For a new project, the orchestrator loads the bootstrap skill, copies and hashes
the PRD baseline, creates the isolated artifacts, displays the complete feature
division, and continues unless a defined escalation applies. For an existing
project, provide its control-workspace path or ID. The orchestrator validates
the recorded baseline, branches, worktrees, state, and runnable gates before
choosing exactly one ready card.

For a Gauntlet-enabled card, OpenCode dispatches a new `triad-evaluator`
subagent after valid verification; it receives the blind packet only and returns
one largest gap when the quality bar wins. The rest of the loop remains
unchanged: developer evidence, independent review, evidence-based transition, local commit per approved card, normal branch push
after all declared delivery gates, then owner-controlled demos. Pull requests,
releases, package publication, force pushes, and demo lifecycle remain explicit
owner decisions.

## Verify before real delivery

After installation, run this local discovery check from the control repository:

```bash
opencode agent list
```

Confirm that `triad-orchestrator`, `triad-developer`, `triad-evaluator`, and `triad-reviewer` are
listed, then open OpenCode and verify that `/triad` is offered. Use the small,
disposable forward test described in the [Codex replication guide](codex-replication.md#forward-test-before-adopting)
before applying the loop to a production project. That test proves actual
delegation, independent review, rework selection, commit/push behavior, and
demo control rather than merely checking that the configuration parses.
