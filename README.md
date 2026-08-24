# Triad+

<p align="center">
  <img src="assets/triad-plus-engineering-loop-icon.svg" alt="Triad+ logo" width="220">
</p>

Triad+ is a lightweight engineering loop for coding agents with three explicit roles.

> **Developer proposes. Reviewer challenges. Orchestrator governs.**

It is not a workflow engine or autonomous development platform. The coding-agent host stays in control; Triad+ provides role contracts, independent review, and verification evidence.

```text
                Orchestrator
                /           \
          Developer  ←→  Reviewer

Triad approved → optional fresh Evaluator+
```

## Why Triad?

A single agent can implement, self-check, and declare success in one conversation. Triad separates those responsibilities: the Developer changes the candidate, the Reviewer looks for defects, and the Orchestrator decides rework, approval, or escalation. `triad-verify` supplies environment-derived gate evidence, distinct from an agent claim.

## Supported coding agents

| Runtime | Orchestrator | Developer | Reviewer | Evaluator+ | Verification dispatch |
| --- | --- | --- | --- | --- | --- |
| Codex | Yes | Yes | Yes | Yes | Explicit fallback; async hook when validated |
| Claude Code | Yes | Yes | Yes | Yes | Explicit fallback; hook when validated |
| OpenCode | Yes | Yes | Yes | Yes | Explicit dispatch |
| Antigravity | Yes | Yes | Yes | Yes | Explicit dispatch |
| Hermes Agent | Yes | Yes | Yes | Yes | Explicit dispatch |

Hooks are optional optimizations; they write evidence and never make a Triad state decision. See [runtime details](docs/runtimes.md).

## Quick start

Requirements: Node.js 20+ and one supported coding-agent host.

```bash
npx triad-plus init --host codex --control /absolute/path/to/triad-control --global
npx triad-plus doctor --host codex --control /absolute/path/to/triad-control
```

`init` creates a separate control workspace and refuses overwrites. Open it in the selected host, then start Triad with an absolute PRD path:

| Host | Entry point |
| --- | --- |
| Codex | `/prompts:triad /absolute/path/to/prd.md` |
| Claude Code | `/triad /absolute/path/to/prd.md` |
| OpenCode | `/triad /absolute/path/to/prd.md` |
| Antigravity | `/triad /absolute/path/to/prd.md` |
| Hermes Agent | `/triad /absolute/path/to/prd.md` |

The Orchestrator presents feature cards before implementation. Follow [Getting started](docs/getting-started.md) for the complete copy-paste walkthrough.

## Configure agents

The wizard or reviewed `team.json` configures display name/persona, model, and supported effort/options for each role. Use neutral names. The selected adapter/runtime is project-level; per-role model binding is applied only where the host supports it. [Configuration](docs/configuration.md) explains the exact contract.

## Optional Evaluator+

Evaluator+ is not a fourth member of Triad. After Reviewer approval, invoke the native command with `--evaluator` where supported:

```text
/triad --evaluator
```

It evaluates the completed result freshly and independently. A `FAIL` does not reopen Triad or start repair. See [Evaluator+](docs/evaluator-plus.md).

## Architecture and limits

Triad+ consists of role skills, adapters, and a verifier. Core has no runtime-specific behavior; adapters own installation, entry-point, lifecycle, and model-binding differences. The verifier validates binding, runs declared control-plane gates, detects mutation, and writes atomic evidence. It does not govern the conversation or replace the Orchestrator.

Triad+ does not provide a daemon, scheduler, dashboard, shared memory, automatic model routing, multi-reviewer voting, or evaluator-driven repair. Read [architecture](docs/architecture.md), [verification](docs/verification.md), and [troubleshooting](docs/troubleshooting.md).

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md), run `npm test`, and keep runtime-specific behavior inside an adapter.

## License

[MIT](LICENSE).
