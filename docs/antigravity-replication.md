# Antigravity replication guide

The Antigravity adapter installs the same Triad+ control method without placing
planning or evidence records in a product repository. It uses Antigravity's
workspace `.agents/skills/` and `.agents/agents/` conventions: the shared
skills retain their standard form, while the local `triad` skill is the native
`/triad` entry point.

## Install

Create a project-control workspace outside every product repository, then run:

```bash
npx triad-plus init --host antigravity --control /path/to/project-control
```

The installer is collision-safe: it refuses an existing target rather than
merging over it. It installs:

- `.agents/skills/triad-loop-*` — the five shared Triad+ skills;
- `.agents/skills/triad/` — the `/triad` workflow wrapper;
- `.agents/agents/triad-{orchestrator,developer,evaluator,reviewer}/agent.md`
  — the four technical roles;
- `.triad-runtime/` — the local external-verification runner and schemas.

For the user-level equivalents, use `--global`; Antigravity discovers them
under `~/.gemini/config/`:

```bash
npx triad-plus init --host antigravity --control /path/to/project-control --global
```

The package also includes a direct, collision-safe installer for environments
where `npx` is not wanted:

```bash
./adapters/antigravity/install.sh --project /path/to/project-control
./adapters/antigravity/install.sh --global
```

## Configure the team

The interactive installer asks for language, owner address, display names,
personas, and a model contract for the Orchestrator, Developer, Evaluator, and
Reviewer. It stores the result only at:

```text
<project-control>/.triad-plus/team.json
```

For repeatable provisioning, pass a reviewed `team.json`:

```bash
npx triad-plus init --host antigravity --control /path/to/project-control \
  --team-config /path/to/team.json
```

Antigravity chooses models through its native controls. Triad+ keeps the model
contract as a visible project-control record rather than inventing an
unsupported per-agent configuration field. The active Orchestrator session
must use the recorded Orchestrator model. When Antigravity does not expose the
active model identity, `/triad` asks the owner to confirm it rather than
pretending to verify it; unavailable configured roles stop the loop instead of
being silently replaced.

## Start and run

Open the project-control workspace in Antigravity and invoke:

```text
/triad /absolute/path/to/prd.md
```

The wrapper acts as the Orchestrator. It loads `team.json`, bootstraps or
resumes the project, declares the feature-card plan before delivery work, and
delegates normal implementation, fresh Gauntlet evaluation, and independent
review to the named technical agents. It does not routinely develop or review
itself.

At bootstrap and resume it records runtime capability with:

```bash
.triad-runtime/triad-runtime-capabilities.mjs --host antigravity
```

The initial adapter selects `explicit_dispatch`: Antigravity subagents provide
role isolation, but this package does not claim a verified lifecycle callback
for automatically dispatching external verification. The Orchestrator therefore
runs the recorded verifier explicitly after every candidate that requires it.
If a future versioned lifecycle adapter is added and the capability snapshot
validates it, the established Triad+ routing rules can select it instead.

## Verify installation

Use the read-only doctor command:

```bash
npx triad-plus doctor --host antigravity --control /path/to/project-control
```

It reports every missing asset and changes nothing.
