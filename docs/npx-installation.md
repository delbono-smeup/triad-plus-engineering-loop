# Triad+ CLI installation

The `triad-plus` package installs the adapter, shared skills, and verification
runtime for one project-control workspace. It does not modify product
repositories and refuses every overwrite.

## Install a project

Choose the host, create or choose a control workspace outside the product
repositories, and run one command:

```bash
npx triad-plus init --host codex --control /path/to/project-control --global
```

Supported hosts are `codex`, `opencode`, and `claude-code`.

`--global` is required once for Codex if the user wants its native
`/prompts:triad` entry point. It is optional for OpenCode and Claude Code,
whose project-local `/triad` command works without it. The command prints the
next step and keeps the host-specific role/model selection under the owner's
control.

Run a read-only completeness check at any time:

```bash
npx triad-plus doctor --host codex --control /path/to/project-control
```

## Configure the role profiles

The installer deliberately does not choose models or personalities. Configure
four host profiles according to the host's native configuration format:

| Role | Responsibility |
| --- | --- |
| Orchestrator | Controls the state, decisions, delegation, and delivery. |
| Developer | Implements one card at a time. |
| Evaluator | Freshly assesses Gauntlet cards without developer history. |
| Reviewer | Independently reviews verified work. |

Make the profiles visible to the Orchestrator. If one is unavailable, the loop
must stop rather than silently replacing it. Model routing and agent
personalities are deployer choices, not part of Triad+.

## Start the loop

Open the control workspace in the selected host, then use:

| Host | Command |
| --- | --- |
| Codex | `/prompts:triad /absolute/path/to/prd.md` |
| OpenCode | `/triad /absolute/path/to/prd.md` |
| Claude Code | `/triad /absolute/path/to/prd.md` |

The Orchestrator extracts what it can from the PRD, asks for only the missing
project facts, and shows the proposed feature-card plan before delivery work
begins.
