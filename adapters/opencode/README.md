# Triad Engineering Loop for OpenCode

This adapter makes the repository's existing four standard Agent Skills
operational in OpenCode. It installs three specialized agents and the `/triad`
command; it does not duplicate the method or alter `opencode.json`.

## Install into one project-control repository

From the root of this cloned repository, run:

```bash
./adapters/opencode/install.sh --project /path/to/project-control-repository
```

The installer copies the following into the selected repository's `.opencode/`
directory:

```text
agents/triad-orchestrator.md
agents/triad-developer.md
agents/triad-reviewer.md
commands/triad.md
skills/triad-loop-bootstrap/
skills/triad-loop-orchestrator/
skills/triad-loop-developer/
skills/triad-loop-reviewer/
```

It checks every destination before copying and stops if any would be
overwritten. No global settings, credentials, product source, or worktrees are
copied.

## Optional global installation

To make Triad available in all OpenCode projects for the current user:

```bash
./adapters/opencode/install.sh --global
```

This writes only the Triad agents, command, and skills below
`~/.config/opencode/`. A project-local installation is preferable when teams
need the configuration versioned with the project-control repository.

## Configure models deliberately

The adapter intentionally does not set `model` in its agent files. OpenCode
therefore uses the currently selected primary model and, by default, passes it
to subagents. Set a `model: provider/model-id` field in each installed agent
file when role-specific routing is wanted:

| Agent | Recommended profile |
| --- | --- |
| `triad-orchestrator` | Reliable planning and orchestration model, medium reasoning. |
| `triad-developer` | Highest-capability implementation model. |
| `triad-reviewer` | Independent, reliable review model, medium reasoning. |

Use `opencode models` to inspect the provider/model identifiers available in
the local installation. Keep the developer and reviewer separately configured
when independent model routing is required.

## Start the loop

Launch OpenCode from the project-control repository, then enter:

```text
/triad <PRD location or concise project request>
```

For a new project, the orchestrator asks only for missing essentials that
prevent safe setup or measurable cards, creates the control artifacts outside
product repositories, declares the card plan, and begins. For an existing
project, give its project ID or control-workspace path after `/triad` and it
resumes from the recorded state.

The developer and reviewer are hidden implementation subagents. The
orchestrator can invoke only those two through the Task tool; the reviewer has
read-only file permissions but can run verification commands. The agents allow
access to declared external worktrees so a multi-repository project can operate
from its control repository. Their prompts still restrict work to paths,
branches, and worktrees declared in the project manifest.

## Verify installation

From the selected control repository, confirm that OpenCode discovered the
agents:

```bash
opencode agent list
```

Then open the TUI and type `/triad`. The command description should appear.
Before using the adapter for real delivery, follow the forward test in the
[Codex replication guide](../../docs/codex-replication.md#forward-test-before-adopting): the
same observable checks validate this OpenCode adapter.
