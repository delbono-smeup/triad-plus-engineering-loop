# Getting started

Triad+ keeps project-control records outside product repositories. Choose an empty
directory for that workspace and a runtime available on your machine.

```bash
npx triad-plus init --host codex --control "$PWD/triad-control" --global
npx triad-plus doctor --host codex --control "$PWD/triad-control"
```

The interactive setup asks for language, owner address, neutral role names,
personas, models, and whether optional Evaluator+ is enabled. When enabled,
Evaluator+ is automatically dispatched after Triad approval. It writes only
after you type `install`.

For non-interactive setup, pass a reviewed team file:

```bash
npx triad-plus init --host opencode --control "$PWD/triad-control" --team-config ./team.json
```

Open `triad-control` in the selected host and invoke its native Triad entry
point with an absolute PRD path. The Orchestrator snapshots the PRD, asks only
for missing measurable facts, and shows feature cards before implementation.

For the first run, use a small PRD with one observable acceptance criterion and
one deterministic command such as a focused unit test. The expected path is:

```text
Orchestrator → Developer → verifier evidence → Reviewer → approved | rework | blocked
```

The host agent governs the conversation. Triad+ does not start product services
or demonstrations unless you explicitly request them.
