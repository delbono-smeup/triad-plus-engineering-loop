# Triad Engineering Loop: Codex Replication Guide

## What this package provides

The `skills/` directory is the executable part of this method. It contains four
standard Agent Skills:

| Skill | Use it for |
| --- | --- |
| `triad-loop-bootstrap` | Creating the isolated project workspace and PRD baseline. |
| `triad-loop-orchestrator` | Coordinating cards, evidence, decisions, commits, push, integration, and demos. |
| `triad-loop-developer` | Implementing one bounded feature card and its tests. |
| `triad-loop-reviewer` | Independently reviewing one developer attempt. |

Each skill has a `SKILL.md` with standard frontmatter and `agents/openai.yaml`
metadata. Bootstrap contains copyable workspace templates. Keep the four skills
together so their state model and file names remain compatible.

## Install the skills

Choose a skill directory that the target Codex environment discovers, for
example a project-local `.agents/skills/` directory. Copy the four skill
folders, preserving their names and `agents/` and `assets/` subdirectories.

Validate each folder after copying:

```bash
npx --yes skills-ref@latest validate <path-to-skill>
```

The skills are instructions, not a model-routing mechanism. Configure the host
environment with three named role profiles and make their availability visible
to the orchestrator. A suitable default is:

| Profile | Recommended model profile | Responsibility |
| --- | --- | --- |
| `triad_orchestrator` | GPT-5.6 Terra, medium reasoning | Coordinates; delegates by default. |
| `triad_developer` | GPT-5.6 Luna, maximum reasoning | Implements one card at a time. |
| `triad_reviewer` | GPT-5.6 Terra, medium reasoning | Independently reviews each attempt. |

If a configured profile is unavailable, the orchestrator stops and reports the
exact issue. It must not silently substitute a weaker or different role.

## Configure custom role profiles

Use the configuration mechanism supported by the local Codex version to create
three custom-agent profiles. Give each profile a clear role instruction and map
it to the corresponding skill:

- the orchestrator uses `triad-loop-bootstrap` and `triad-loop-orchestrator`;
- the developer uses `triad-loop-developer`;
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

Use a private project-control Git repository when the project needs durable
history. The product repositories remain implementation targets; do not store
planning records, agent reports, credentials, or worktrees in them.

## Start and operate the loop

The orchestrator verifies configuration, branch/worktree isolation, PRD hash,
and runnable gates. It presents the feature plan and then starts the first ready
card without waiting for an extra approval.

For each iteration, call the developer profile with the card, PRD excerpt,
repository instructions, and gates. Call a fresh reviewer profile with the
same card, diff, and evidence. The orchestrator writes every state transition
and makes the binding workflow decision.

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
3. verify that the developer and reviewer profiles receive different tasks;
4. deliberately create a failing gate and confirm that the loop chooses rework;
5. verify a local commit per approved card and a normal push only at delivery;
6. if a demo is configured, verify that it remains stopped until explicitly
   requested and is stopped only after an explicit completion message.

This test validates both the skills and the host’s real custom-agent/model
configuration. A configuration file that parses is useful but is not substitute
for an observed delegation run.
