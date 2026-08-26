# Codex adapter

Install with `npx triad-plus init --host codex --control <path> --global`.
Open the control workspace and run `/prompts:triad <absolute-prd-path>`.

Codex uses role profiles for the Orchestrator, Developer, Reviewer, and optional
Evaluator+. Verification uses explicit dispatch by default, even when a complete,
version-compatible async `SubagentStop` hook is installed. This keeps the normal
unattended path on the directly auditable verifier route.

The async hook remains available as an experimental opt-in by setting
`requested_mode=async_hook` in capability detection. Hook output is evidence
only; it never changes Triad state by itself. If the requested experimental hook
is unavailable, capability detection fails safe to explicit dispatch.
