# Changelog

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

## Unreleased

- Add the candidate GitHub Copilot adapter with project/global custom agents,
  the `triad` skill, explicit verification by default, and doctor diagnostics.
- Document the Copilot desktop-app validation gate; full support remains
  pending a live distinct-context smoke.

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
