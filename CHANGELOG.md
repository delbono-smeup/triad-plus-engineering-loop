# Changelog

## Unreleased

- Keep the Codex Orchestrator parent turn alive across delegated-agent wait
  timeouts by refreshing status and re-waiting instead of returning control to
  the owner.

## 1.3.0 — 2026-08-26

- Keep the declared card chain unattended from Developer completion through
  verification, review, and the next dependency-satisfied card.
- Bind repository skill files and hashes to attempts as verifier evidence, and
  make role activations observable to the owner.
- Require a formal owner delivery closure: final push evidence, optional
  Evaluator+ report, handoff, run-record update, and practical-test guidance.
- Make local versus remote demo access explicit; `localhost` is never reported
  as a remote endpoint.
- Use explicit verification dispatch by default on Codex; retain the async
  `SubagentStop` hook as an experimental opt-in path.

## 1.4.0 — 2026-08-28

- Promote the GitHub Copilot adapter to supported status with official Copilot
  CLI/Desktop integration and distinct Orchestrator, Developer, Reviewer, and
  Evaluator+ custom-agent contexts.
- Validate explicit verification dispatch and unattended dependent-card
  continuation in Copilot Desktop.
- Harden the Evaluator+ packet boundary so verdicts use only the approved
  packet and not out-of-packet control or delivery records.

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
