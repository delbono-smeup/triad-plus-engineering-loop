# Triad Engineering Loop

<p align="center">
  <img src="assets/triad-engineering-loop-icon.svg" width="152" alt="Triad Engineering Loop icon: three connected roles and verified evidence">
</p>

Triad Engineering Loop is an evidence-driven delivery method for one
orchestrator, one developer, and one independent reviewer. It separates project
control records from product source code and keeps human intervention limited to
real product decisions.

- [Operating guide](docs/operating-guide.md) explains the method for people.
- [Guida operativa italiana](docs/operating-guide.it.md) is the complete Italian localization.
- [Codex replication guide](docs/codex-replication.md) explains how to install
  and operate the reusable Agent Skills.
- `skills/` contains the four standard Agent Skills that implement the method.

The method does not require a particular organization, repository host, or
product stack. The examples use Git, a private project-control repository, and
local worktrees because they provide reproducible evidence and safe isolation.
