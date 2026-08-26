# Compatibility matrix

| Runtime | Install | Orchestrator | Developer | Reviewer | Evaluator+ | Verification dispatch | Hook support |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Codex | Yes | Yes | Yes | Yes | Yes | Explicit dispatch by default; experimental async `SubagentStop` opt-in | Optional async `SubagentStop` |
| Claude Code | Yes | Yes | Yes | Yes | Yes | Explicit fallback; hook when validated | Optional `SubagentStop` |
| OpenCode | Yes | Yes | Yes | Yes | Yes | Explicit dispatch | No adapter hook |
| Antigravity | Yes | Yes | Yes | Yes | Yes | Explicit dispatch | No adapter hook |
| Hermes Agent | Yes | Yes | Yes | Yes | Yes | Explicit dispatch | No adapter hook |

All adapters consume the same role IDs and project-control records. Runtime
model/effort application is limited to the facilities each host exposes; the
full requested contract is always retained in `.triad-plus/team.json`.
