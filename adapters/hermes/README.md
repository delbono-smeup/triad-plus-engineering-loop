# Triad+ for Hermes Agent

Hermes uses installed skills as slash commands. Install the shared Triad skills
and the `/triad` wrapper in the Hermes user skill directory:

```bash
npx triad-plus init --host hermes --control /path/to/project-control --global
```

The project installation supplies only the project-local verification runtime;
the user-level installation supplies skills to the active Hermes profile (or the
default `~/.hermes/skills/` when no profile is active).
Open Hermes from the project-control workspace and run:

```text
/triad /absolute/path/to/prd.md
```

Hermes supports one-shot use through `hermes chat -q` and `--skills`. The
adapter uses those host primitives for separately invoked Developer and Reviewer
roles when the configured model/provider is available. It uses explicit
verification dispatch; no Hermes lifecycle hook is assumed.

Evaluator+ is opt-in and post-run only. Set `roles.evaluator.enabled` to `true`
in `team.json` and the Orchestrator dispatches it automatically after Triad
approval. It receives the approved goal, acceptance target, final artifact, and
verifier evidence, then writes an independent report without reopening Triad.
