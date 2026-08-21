# Triad Engineering Loop: Claude Code Replication Guide

## Purpose

The Claude Code adapter reuses the five standard Triad skills. It supplies a
`/triad` command and three isolated subagents: Developer, Evaluator, and
Reviewer. The main Claude Code session is the orchestrator; it retains control
of state and delivery decisions.

## Install

From this repository root, install into a project-control repository:

```bash
./adapters/claude-code/install.sh --project /path/to/project-control-repository
```

The install is collision-safe. It copies `.claude/agents/`,
`.claude/commands/`, `.claude/skills/`, an inert hook fragment, and the local
`.triad-runtime/`. The product repositories remain declared targets; they do not
receive planning records, agent reports, or control-plane files.

The optional global form installs only agent definitions, command, and skills:

```bash
./adapters/claude-code/install.sh --global
```

## Agent mapping

| Claude Code surface | Triad responsibility |
| --- | --- |
| Main session plus `/triad` | Orchestrator: state, dispatch, evidence, policy, and final transition. |
| `triad-developer` subagent | Bounded implementation or largest-gap repair. |
| `triad-evaluator` subagent | Fresh quality-bar comparison, without developer narrative/history. |
| `triad-reviewer` subagent | Final independent delivery recommendation. |

The subagents preload only their matching Triad skill. Developer can edit;
Evaluator and Reviewer use planning/read-only permissions. All model choices are
left to the local Claude Code configuration. Do not silently substitute an
unavailable desired profile during a live project.

## Capability-selected verification

At bootstrap and on a relevant resume, run:

```bash
.triad-runtime/triad-runtime-capabilities.mjs --host claude-code
```

Store its output in `.loop/runtime/capabilities.json`. In the base adapter,
Claude Code selects `explicit_dispatch`: the orchestrator launches the Node
verifier after the Developer finishes, then accepts only evidence matching the
active assignment and fingerprint.

Claude Code also supports `SubagentStop` command hooks. The installed
`.claude/triad-hooks.json` is a non-active fragment that targets exactly
`triad-developer`. After replacing its placeholders and merging it into trusted
Claude settings, pass that actual settings file with `--hook-config`; the
detector selects `hook_dispatch`. This hook writes evidence only. The
orchestrator remains the only state-transition authority.

## Operate and validate

Start Claude Code from the control repository and enter:

```text
/triad <PRD location or project request>
```

Use `/agents` to confirm subagents, `/skills` to confirm skill discovery, and
`/hooks` to confirm an enabled hook. Where supported by the installed version,
run `claude plugin validate .claude/agents` before real delivery. Then use the
forward-test protocol in [tests/forward-test-v2.md](../tests/forward-test-v2.md)
to prove the selected verification route, evidence freshness, Gauntlet, and
final-review behavior.
