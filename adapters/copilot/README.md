# GitHub Copilot adapter

This adapter targets the GitHub Copilot CLI and the GitHub Copilot desktop app
using their documented custom-agent and agent-skill primitives.

Project assets are installed under `.github/agents/` and `.github/skills/triad/`;
`--global` additionally installs role profiles and the Triad skill under
`~/.copilot/agents/` and `~/.copilot/skills/`. The project/control workspace is
the source of run configuration; one workspace selects one host adapter.

Use `/triad <absolute-path-to-prd>` when the project skill is available. If the
surface does not expose the skill as a slash command, select
`triad-orchestrator` with `/agent` and provide the same PRD request. The
adapter always uses explicit verification dispatch and has no lifecycle hook.

Role models are written to the official custom-agent `model` and
`reasoningEffort` frontmatter fields when supplied by `team.json`; Copilot may
fall back to its session/provider defaults when a requested model is not
available. Copilot custom agents run in separate subagent contexts when the
host delegates them; the desktop-app validation is a required release gate.
