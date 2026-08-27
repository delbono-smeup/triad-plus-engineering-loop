# Triad+ operating guide

Triad+ is an operating method for a coding-agent host. It does not run a daemon,
scheduler, workflow database, or autonomous state controller.

## The method

```text
ready → in_progress → verifying → in_review → approved
                                      ├── rework → in_progress
                                      └── blocked
```

The Orchestrator owns the next step and escalation. The Developer owns a bounded
implementation attempt. The Reviewer owns its `approved`, `rework`, or `blocked`
verdict.

Before work, the Orchestrator snapshots the PRD, declares measurable feature
cards, target repositories/worktrees/branches, and deterministic quality gates.
It shows the plan to the owner, then delegates ordinary development and review.

After Developer completion, verification happens through a validated host hook
when available, or explicit Orchestrator dispatch. The verifier executes only
declared `control-plane` commands. Atomic evidence binds assignment ID/hash, run,
worktree branch, candidate fingerprint, PRD/card hashes, and gate definition
hash. A developer saying tests pass is a claim; verifier output is
environment-derived evidence. Failed or invalid evidence cannot be treated as a
pass.

Codex is intentionally an exception to automatic hook selection: its `auto`
mode uses explicit dispatch. The async `SubagentStop` route remains an
experimental opt-in; this does not change the rule that hooks produce evidence
and the Orchestrator governs progress.

The GitHub Copilot adapter uses project custom agents and the `triad` skill,
with explicit verification dispatch and no lifecycle hook. Its desktop-app
smoke has validated distinct role contexts and unattended continuation in
addition to the CLI asset and doctor checks.

The Reviewer sees the card, diff, Developer report, previous findings, and
verifier evidence. `rework` returns a bounded finding to Developer; `blocked`
asks the Orchestrator to escalate the stated decision. Normal pushes may happen
autonomously once declared goals pass. A final owner delivery is a separate
closure gate: it records the final push, optional evaluation, handoff, final run
record, and practical test before the project is called delivered. Demo start and
stop remain owner-controlled.

## Evaluator+

Evaluator+ is optional and outside the production loop. When enabled in
`team.json`, the Orchestrator dispatches it automatically after `approved`. It
inspects only the goal, acceptance target, final candidate, and verifier evidence.
Its report is `PASS`, `FAIL`, or `INDETERMINATE`. A failure does not modify the
closed run or start repair. See [Evaluator+](evaluator-plus.md).

## Human decisions and records

Triad+ asks the owner only for missing success criteria, material scope/policy
changes, unresolved ambiguity, repeated failure, or a requested demo. Keep the
immutable PRD, cards, assignments, evidence, review reports, optional Evaluator+
reports, and handoff in a separate project-control workspace. Never place tokens
or secrets there. Hooks are an optimization, not authority; explicit verification
is always the fallback. See the [compatibility matrix](compatibility.md).

For a configured demo service, record its command, local URL, remote-access mode,
and remote URL in the project and handoff. `localhost` is local-only; do not give
it to a remote tester as a reachable endpoint. Start the service only on the
owner's request and validate any declared remote URL before presenting it.
