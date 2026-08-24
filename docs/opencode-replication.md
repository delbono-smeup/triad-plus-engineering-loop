# OpenCode adapter

Install with `npx triad-plus init --host opencode --control <path>`. Open the
control workspace and run `/triad <absolute-prd-path>`. Project-local agent and
command assets carry the configured role models where OpenCode supports them.

Verification uses explicit Orchestrator dispatch. A configured Evaluator+ is
automatically invoked only after a Reviewer-approved result; it cannot reopen
that run.
