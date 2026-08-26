# Runtime adapters

Every adapter installs the same role skills and verifier runtime, while retaining
host-specific entry points and configuration behavior.

| Runtime | Prerequisite | Entry point | Verification | Hook limitation |
| --- | --- | --- | --- | --- |
| Codex | Codex CLI | `/prompts:triad` | Explicit dispatch by default; experimental async hook opt-in | Hook is optional, requires trusted configuration, and is not selected by `auto`. |
| Claude Code | Claude Code CLI | `/triad` | Explicit dispatch; hook when validated | Hook is optional and requires trusted configuration. |
| OpenCode | OpenCode | `/triad` | Explicit dispatch | No Triad lifecycle hook. |
| Antigravity | Antigravity | `/triad` | Explicit dispatch | No Triad lifecycle hook. |
| Hermes Agent | Hermes Agent | `/triad` | Explicit dispatch | No Triad lifecycle hook. |

Install with `npx triad-plus init --host <runtime> --control <path>`; use
`--global` when you want host-level command assets. `doctor` reports the runtime
binary, adapter assets, verifier, team file, and optional Evaluator+ state.

Hermes installs user skills into the active Hermes profile. Its role invocations
must bind terminal operations to the declared worktree; this is handled by its
adapter instructions. It is supported, not experimental.

See the concise host guides for [Codex](codex-replication.md),
[Claude Code](claude-code-replication.md), [OpenCode](opencode-replication.md),
and [Antigravity](antigravity-replication.md).

## OpenCode

Use the interactive OpenCode TUI for complete multi-step Triad runs. OpenCode
1.18.0 validated the full Orchestrator → Developer → verifier → Reviewer →
configured Evaluator+ lifecycle in the TUI. `opencode run` is useful for
one-shot work but does not retain that multi-step parent/subagent lifecycle.
