# Triad+ CLI installation

The `triad-plus` package installs the adapter, shared skills, and verification
runtime for one project-control workspace. It does not modify product
repositories and refuses every overwrite.

## Install a project

Choose the host, create or choose a control workspace outside the product
repositories, and either use the interactive wizard:

```bash
npx triad-plus
```

It asks for the host, control workspace, optional user-level installation,
conversation language, owner address, display names and personas for all four
roles, and a model contract for each role. It then displays a summary. It changes nothing
unless the user types `install`.

For scripts and repeatable setup, use the explicit form instead:

```bash
npx triad-plus init --host codex --control /path/to/project-control --global
```

For non-interactive fleet setup, pass a previously reviewed `team.json`:

```bash
npx triad-plus init --host codex --control /path/to/project-control \
  --global --team-config /path/to/team.json
```

Supported hosts are `codex`, `opencode`, `claude-code`, and `antigravity`.

`--global` is required once for Codex if the user wants its native
`/prompts:triad` entry point. It is optional for OpenCode, Claude Code, and
Antigravity,
whose project-local `/triad` command works without it. The command prints the
next step and keeps the host-specific role/model selection under the owner's
control.

Run a read-only completeness check at any time:

```bash
npx triad-plus doctor --host codex --control /path/to/project-control
```

## Configure the role profiles

The wizard saves conversation and role preferences in
`.triad-plus/team.json` inside the project-control workspace. It is not written
to product repositories. Technical agent identifiers remain stable; display
names and personalities affect only communication.

The wizard accepts a host-native model ID for every role. A blank value is an
explicit choice to use the host default. It applies model configuration where
the host supports it directly:

- OpenCode writes it into the four project-local agent definitions;
- Claude Code writes it into the three delegated subagent definitions;
- Codex writes the four user-level profiles when the user selects global
  installation.

Antigravity keeps the selected contracts in `team.json` and uses its native
model controls; Triad+ does not write an unsupported per-agent model field.

Codex and Claude Code use the model of the active main session for the
Orchestrator. Triad+ records its required model in `team.json` and the entry
command reports a mismatch before it starts work; it never silently substitutes
a different model.

The four technical roles remain:

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
| Antigravity | `/triad /absolute/path/to/prd.md` |

The Orchestrator extracts what it can from the PRD, asks for only the missing
project facts, and shows the proposed feature-card plan before delivery work
begins.
