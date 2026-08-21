# Triad Engineering Loop: Codex Replication Guide

## What this package provides

The `skills/` directory is the executable part of this method. It contains five
standard Agent Skills:

| Skill | Use it for |
| --- | --- |
| `triad-loop-bootstrap` | Creating the isolated project workspace and PRD baseline. |
| `triad-loop-orchestrator` | Coordinating cards, evidence, decisions, commits, push, integration, and demos. |
| `triad-loop-developer` | Implementing one bounded feature card and its tests. |
| `triad-loop-evaluator` | Freshly evaluating a verified Gauntlet candidate against its quality bar. |
| `triad-loop-reviewer` | Independently reviewing one developer attempt. |

Each skill has a `SKILL.md` with standard frontmatter and `agents/openai.yaml`
metadata. Bootstrap contains copyable workspace templates. Keep the five skills
together so their state model and file names remain compatible.

## Install the Codex adapter and skills

The repository includes a collision-safe Codex adapter. Install the project
parts into every project-control repository, then install the user-level prompt
once:

```bash
./adapters/codex/install.sh --project /path/to/project-control-repository
./adapters/codex/install.sh --global
```

The project installation writes the five skills to `.agents/skills/` and the
control-plane runner to `.triad-runtime/`. The global installation writes the
same skills and the native Codex prompt to `$CODEX_HOME/prompts/triad.md`
(`$HOME/.codex` by default). Both modes stop before overwriting an existing
path.

Start Codex in the control repository and invoke `/prompts:triad`, optionally
followed by a PRD path or project request. Codex's native custom-prompt form is
namespaced, so the equivalent of the `/triad` command in OpenCode and Claude
Code is deliberately `/prompts:triad`. The prompt makes the current
conversation the Orchestrator; it does not create a second hidden coordinator.

## Install the skills manually

Choose a skill directory that the target Codex environment discovers, for
example a project-local `.agents/skills/` directory. Copy the five skill
folders, preserving their names and `agents/` and `assets/` subdirectories.

Validate each folder after copying:

```bash
npx --yes skills-ref@latest validate <path-to-skill>
```

The skills are instructions, not a model-routing mechanism. Configure the host
environment with four named role profiles and make their availability visible
to the orchestrator. A suitable default is:

| Profile | Recommended model profile | Responsibility |
| --- | --- | --- |
| `triad_orchestrator` | GPT-5.6 Terra, medium reasoning | Coordinates; delegates by default. |
| `triad_developer` | GPT-5.6 Luna, maximum reasoning | Implements one card at a time. |
| `triad_evaluator` | GPT-5.6 Terra, medium reasoning | Freshly evaluates a quality bar without developer history. |
| `triad_reviewer` | GPT-5.6 Terra, medium reasoning | Independently reviews each attempt. |

If a configured profile is unavailable, the orchestrator stops and reports the
exact issue. It must not silently substitute a weaker or different role.

## Configure custom role profiles

Use the configuration mechanism supported by the local Codex version to create
four custom-agent profiles. Give each profile a clear role instruction and map
it to the corresponding skill:

- the orchestrator uses `triad-loop-bootstrap` and `triad-loop-orchestrator`;
- the developer uses `triad-loop-developer`;
- the evaluator uses `triad-loop-evaluator` only for Gauntlet cards;
- the reviewer uses `triad-loop-reviewer`.

The profiles must preserve role separation. The developer should not review its
own patch; the reviewer should not implement routine fixes; the orchestrator
should delegate both activities except for a recorded exception.

## Create a project

Invoke `$triad-loop-bootstrap` with the project ID, PRD source, target
repositories, base branches, desired project branches, and measurable success
conditions. The bootstrap skill creates a workspace outside the product
repositories, copies the PRD, records the baseline hash, and produces the
feature plan and loop files.

For a Gauntlet card, also snapshot a concrete quality bar under
`.loop/quality-bars/`, record its SHA-256 and enforcement (`required` or
`aspirational`), configure a safety limit in `.loop/evaluation-policy.yaml`,
and create candidate-observation instructions. `optimization.mode: none`
remains the backward-compatible default.

Use a private project-control Git repository when the project needs durable
history. The product repositories remain implementation targets; do not store
planning records, agent reports, credentials, or worktrees in them.

## Start and operate the loop

The orchestrator verifies configuration, branch/worktree isolation, PRD hash,
and runnable gates. It presents the feature plan and then starts the first ready
card without waiting for an extra approval. `/prompts:triad` is the normal
Codex entry point; `$triad-loop-bootstrap` and `$triad-loop-orchestrator` remain
available for a direct skill-level invocation.

For each iteration, call the developer profile with the card, PRD excerpt,
repository instructions, and gates. When the external verification control plane
is configured, create an immutable assignment before dispatch and require its
atomic evidence to match the active candidate fingerprint. A gate result claimed
by the developer is not authoritative.

For a Gauntlet card, construct a minimal evaluation packet only after valid
verification, then call a new evaluator profile without resuming or forking a
developer/evaluator session. The packet excludes developer narrative and attempt
history. `bar_wins` produces one largest gap and bounded repair; a new patch
must pass verification and a fresh evaluation again. Call a fresh reviewer
profile only after the quality-loop policy permits `in_review`. The orchestrator
writes every state transition and makes the binding workflow decision.

## Codex verification adapter

The host-agnostic runner is `runtime/triad-verify.mjs`; it uses Node's standard
library, resolves only a pre-written assignment, hashes trusted gate definitions,
fingerprints the real worktree, caps/redacts logs, writes evidence atomically,
and never changes `run-state.yaml`. Formal contracts are in `schemas/`.

`integrations/codex/hooks.json` is a version-gated configuration fragment for a
Codex CLI `>= 0.148.0` `SubagentStop` asynchronous command hook. Verify the
installed CLI's schema and hook-trust policy before enabling it. The hook only
dispatches the runner; the orchestrator consumes and validates the resulting
file. On an older CLI or a missing hook, record a structured failure and use the
documented explicit runner dispatch rather than treating absence as passing.

Set `project.control_plane.dispatch_mode: auto` for normal use. Bootstrap runs
`runtime/triad-runtime-capabilities.mjs`, snapshots the actual CLI version and
hook readiness, then records either `async_hook` or `explicit_dispatch`. The
orchestrator uses the recorded route; it does not ask the developer to remember
which runtime is installed.

For multi-repository work, set `project.integration.enabled: true` and declare
only the `local-worktrees` strategy. Add a final integration card that depends
on the component cards and specifies the local link/setup commands and
data/event/callback gates. Do not turn package publication or release creation
into an implicit integration step.

## Delivery and demos

The orchestrator commits each approved card locally. After project goals and
delivery checks pass, it performs normal pushes of declared branches. Pull
requests, package publication, releases, and force pushes require separate,
explicit owner authorization.

The delivery handoff is final evidence. A practical test can create a
follow-up card or a successor project, but it does not rewrite the delivered
record. A remote demo starts only on the owner’s command and ends only on the
owner’s command.

## Forward test before adopting

Run a small, disposable project through the complete path:

1. give the bootstrap skill a short PRD with two measurable cards;
2. verify that the plan is declared and artifacts are created outside source;
3. verify that the developer, evaluator, and reviewer profiles receive different tasks;
4. deliberately create a failing gate and confirm that the loop chooses rework;
5. verify a local commit per approved card and a normal push only at delivery;
6. for a Gauntlet card, verify an evaluation packet excludes developer narrative,
   a fresh evaluator returns one gap, stale fingerprint evidence is rejected,
   and aspirational versus required stop policies diverge correctly;
7. if a demo is configured, verify that it remains stopped until explicitly
   requested and is stopped only after an explicit completion message.

This test validates both the skills and the host’s real custom-agent/model
configuration. A configuration file that parses is useful but is not substitute
for an observed delegation run.
