# Claude Code adapter

Install with `npx triad-plus init --host claude-code --control <path>`. Open the
control workspace and run `/triad <absolute-prd-path>`. Claude Code uses its
delegated Developer, Reviewer, and optional Evaluator+ definitions; the active
main session acts as Orchestrator.

A complete `SubagentStop` hook can dispatch verification. Explicit dispatch is
always available, and the hook never owns a Triad transition.
