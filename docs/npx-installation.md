# Install Triad+

Triad+ installs a project-control workspace, not application code. Keep it
outside product repositories whenever possible.

```bash
npx triad-plus
```

The interactive setup selects a host, optional user-level command, language,
owner address, role display names/personas, models, and whether the optional
Evaluator+ is enabled. It changes files only after `install` is typed.

For repeatable setup:

```bash
npx triad-plus init --host codex --control /path/to/project-control --global
npx triad-plus doctor --host codex --control /path/to/project-control
```

Supported hosts: `codex`, `opencode`, `claude-code`, `antigravity`, `hermes`.
Use `--global` to install a host-level entry point where desired. The installer
refuses overwrites. If the control path is recognizably a product Git repository,
it stops unless `--allow-product-repo` is explicitly supplied after review.

The saved `.triad-plus/team.json` separates stable role IDs from display names,
personas, models, and supported effort/options. Existing schema-version-1 team
files remain valid. Core roles are always enabled; Evaluator+ is enabled only
when `roles.evaluator.enabled` is `true`.

| Role | Responsibility |
| --- | --- |
| Orchestrator | Maintains goal/context and decides the next step. |
| Developer | Changes the artifact to meet the declared card. |
| Reviewer | Finds defects and returns approved, rework, or blocked. |
| Evaluator+ | Optionally and freshly judges an approved result after the run. |

Open the control workspace and invoke the host-native command with an absolute
PRD path. The Orchestrator presents feature cards before implementation, then
delegates normal development and review. When `roles.evaluator.enabled` is true,
the Orchestrator invokes Evaluator+ automatically after Triad is approved. Users never create
evaluation packets, report paths, or evidence directories manually.
