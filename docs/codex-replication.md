# Codex adapter

Install with `npx triad-plus init --host codex --control <path> --global`.
Open the control workspace and run `/prompts:triad <absolute-prd-path>`.

Codex uses role profiles for the Orchestrator, Developer, Reviewer, and optional
Evaluator+. The command detects whether a complete, version-compatible async
`SubagentStop` verification hook is installed. If it is not, the Orchestrator
explicitly invokes the verifier. Hook output is evidence only; it never changes
Triad state by itself.
