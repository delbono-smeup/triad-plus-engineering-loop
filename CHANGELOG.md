# Changelog

## Unreleased

- Continue automatically from an approved card to each dependency-satisfied
  successor without requesting an owner acknowledgement.
- Continue automatically from Developer completion through verification and
  independent review; agent-reported completion is not a human wait condition.
- Bind repository skill files and hashes to developer assignments and verify the
  binding as environment-derived evidence.
- Make the configured Orchestrator presentation the first owner-facing message
  and avoid repeating it after the role skill is loaded.
- Let Codex capability detection consume a project hook configuration when one
  is installed, so verified asynchronous dispatch is selected correctly.
- Add attributed role-activation records for Developer, Reviewer, and
  Evaluator+, with Orchestrator delegation notices for owner observability.

## 1.2.0 — 2026-08-25

- Add safe dry-run/apply upgrades for existing project-control workspaces.
- Maintain a narrowly scoped Triad+ role-run instruction overlay and report
  potential host identity-policy conflicts in `doctor`.
- Require the configured Orchestrator to introduce itself at the beginning of
  every Triad+ run.

## 1.1.1 — 2026-08-25

- Ensure every supported host adopts the configured Orchestrator display name
  for owner-facing communication.
- Keep the public install-test fixture neutral.

## 1.1.0 — 2026-08-24

- Automatically dispatch configured Evaluator+ after Triad approval, without
  allowing it to reopen or repair the closed run.
- Add a five-minute OpenCode tutorial and refresh README onboarding.
- Remove operational service artifacts from the public tree.
- Change future releases to Apache-2.0.

## 1.0.0 — 2026-08-24

- Public Triad+ engineering loop with Orchestrator, Developer, and Reviewer.
- Optional fresh post-run Evaluator+.
- Codex, Claude Code, OpenCode, Antigravity, and Hermes Agent adapters.
- Hash-bound control-plane verification evidence and package installer.
- Public setup, runtime, architecture, verification, and contribution guides.
