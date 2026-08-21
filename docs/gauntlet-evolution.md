# Triad Engineering Loop: Gauntlet Evolution

## Why the Gauntlet exists

The normal Triad loop answers a delivery question: does a bounded feature meet
its acceptance criteria, metrics, deterministic gates, and final independent
engineering review? The optional Gauntlet answers a different question: how far
is the real, verified artifact from a concrete quality boundary?

These questions remain separate. Acceptance criteria establish minimum
correctness and completeness. A quality bar provides an observable direction of
optimization: a snapshotted reference screenshot, golden output, benchmark,
reference implementation, scenario suite, or measurable standard. “Beautiful”,
“production ready”, and “good UX” are not usable bars unless made into an
explicit lower-confidence rubric.

## Roles and authority

The delivery roles do not lose authority:

| Role | Owns | Does not own |
| --- | --- | --- |
| Orchestrator | State, sequencing, assignments, evidence validation, plateau/budget policy, arbitration, and transition to final review. | Routine implementation, evaluation, or final technical review. |
| Developer | One bounded implementation or largest-gap repair. | Gate authority, quality-bar victory, state transitions, or delivery approval. |
| Evaluator | A fresh comparison of a real candidate with a quality bar. | Product edits, routine fixes, state transitions, or delivery approval. |
| Reviewer | Final independent engineering/delivery recommendation using the complete trail. | Becoming the quality optimizer or silently waiving a required boundary. |

The evaluator and reviewer are intentionally distinct. The evaluator sees a
minimal, blind packet and tries to find the single highest-impact remaining
quality gap. The reviewer sees the full context and decides whether the change
is correct, safe, maintainable, in scope, and supported by reliable evidence.

## Card contract and state machine

Every card declares one of these modes:

```yaml
optimization:
  mode: none       # default, compatible with the original Triad loop
  quality_bar: null
  enforcement: null
```

or:

```yaml
optimization:
  mode: gauntlet
  quality_bar: UI-BAR-001
  enforcement: required # or aspirational
```

The state route is:

```text
ready -> in_progress -> verifying
  verification fail/invalid/stale -> rework or verification_error
  verification pass + mode none   -> in_review
  verification pass + gauntlet    -> evaluating

evaluating
  candidate_wins                  -> in_review
  bar_wins                        -> quality_rework -> in_progress
  indeterminate                   -> evaluator_retry or blocked
  aspirational stop               -> in_review with residual gap
  required non-winning stop       -> blocked or explicit owner waiver

in_review -> approved | rework | blocked
```

Any new patch after valid verification invalidates prior verification and
evaluation evidence. A reviewer rework therefore returns through verification
and, for a Gauntlet card, a new fresh evaluation.

## First-class quality bars

Quality bars live under `.loop/quality-bars/`. Use
`quality-bar.template.yaml` and preserve source, collection time, snapshot path,
SHA-256, revision when available, references, observable dimensions, objective
thresholds, and comparison mode. Mutable external references must be copied or
otherwise snapshot-hashed before use. A bar cannot change silently mid-loop.

`required` means non-winning plateau, budget, or safety stops block the card
unless the owner explicitly waives the condition. `aspirational` permits final
review after a documented stop, but preserves the residual gap so the reviewer
and owner can see what was intentionally left short of the reference.

## Independent verification control plane

The Node runner at `runtime/triad-verify.mjs` is outside the developer’s
conversation. It receives lifecycle payload from stdin, resolves an immutable
assignment, validates project/worktree/PRD/card/gate hashes, fingerprints the
candidate, runs trusted `control-plane` gates, caps and redacts logs, and writes
`verification.json` by temporary file plus atomic rename. It never writes
`run-state.yaml` or transitions a card.

Assignments are append-only records in `.loop/runtime/assignments/`. They bind
the runtime agent, feature, attempt, worktree, expected baseline hashes, trusted
gate-file hash, run ID, and evidence directory. Gate commands must originate
from that hashed project file, never free-form agent output. The runner rejects
invalid context and marks an artifact changed while gates run as `invalidated`.

The orchestrator accepts evidence only when the feature, attempt, run, hashes,
and candidate fingerprint match the active card. Evidence from an old attempt,
an old artifact, a duplicate asynchronous result, or a changed quality bar is
stale and must be ignored. Missing/aborted hooks are structured failures—not
passing gates.

### Runtime-adaptive dispatch

Bootstrap records a capability snapshot with
`runtime/triad-runtime-capabilities.mjs`. `dispatch_mode: auto` selects the
fastest safe route for the actual host:

| Detected capability | Selected route | Verification action |
| --- | --- | --- |
| Supported, installed, trusted async lifecycle hook | `async_hook` | Wait for the `SubagentStop`-triggered runner under its watchdog. |
| Supported, installed, trusted synchronous lifecycle hook | `hook_dispatch` | Wait for its `SubagentStop`-triggered runner under its watchdog. |
| Missing, older, unconfigured, or untrusted async hook | `explicit_dispatch` | The orchestrator launches the same runner after the developer stops. |
| No usable verifier | `unavailable` | Record infrastructure failure; do not enter review. |

The check includes host/Node availability, version, configuration presence, and
placeholder/trust readiness. It never upgrades a capability from a version
number alone. The adapter currently recognizes Codex async hooks, Claude Code
`SubagentStop` command hooks, and OpenCode explicit dispatch; it never pretends
an unverified host hook exists. Re-run it before a new assignment or after
resuming when runtime configuration changed, and append the new snapshot to the
audit trail. The selected mode remains fixed for the active attempt.

Supported gate executors are `control-plane`, `mcp`, and `manual-evidence`.
The core runner executes the first. MCP and manual evidence remain optional;
they must provide independently verifiable evidence and cannot convert a failed
or unexecuted required gate into a pass.

## Fresh, blind evaluation

After valid verification, the orchestrator creates an auditable
`evaluation-packet.json`. It contains only:

- feature outcome;
- candidate fingerprint, artifact references, and observation instructions;
- quality-bar snapshot, hash, dimensions, and neutral comparison setup;
- valid verification summary and evidence reference.

It excludes developer reports and reasoning, previous evaluator/reviewer
findings, attempt history, and statements about how difficult or improved the
implementation was. Each evaluator is a new session, never a resumed session or
a fork from developer/evaluator history. When A/B is practical, labels are
neutral and ordering may be randomized.

The evaluator writes a result conforming to
`schemas/evaluation-result.schema.json` with one of `candidate_wins`,
`bar_wins`, or `indeterminate`. A `bar_wins` result contains exactly one largest
gap, a stable gap fingerprint, direct observation, why it matters, and the
smallest meaningful bounded repair. It is not a 1–10 score and not a backlog.

## Convergence and stopping

`evaluation-policy.yaml` requires at least one safety limit. It supports a
plateau window, repeated-gap limit, maximum quality iterations, elapsed time,
and optional runtime cost/credit counter. The iteration limit is a safety ceiling
rather than a quality target.

Detect plateau from evidence: recurrence of the same gap fingerprint after a
bounded repair, no closed observable dimension during the configured window,
objective delta below the declared threshold, or multiple fresh evaluators
converging on the same substantive gap. Record one stop reason:
`quality_bar_won`, `plateau`, `budget_exhausted`, `safety_iteration_ceiling`,
`owner_stop`, or `external_blocker`.

## Codex lifecycle adapter

`integrations/codex/hooks.json` is a configuration fragment for Codex CLI
`>= 0.148.0`. It targets only `SubagentStop` events whose agent type is
`triad_developer`, and dispatches the runner asynchronously. The hook is not a
state controller: it may be delayed, duplicated, or aborted on session shutdown,
so the orchestrator watchdog remains authoritative. Direct MCP hook handlers are
optional and synchronous; do not use them for long verification jobs.

Enable the fragment only after verifying the installed CLI schema, project hook
trust, canonical paths, and assignment protocol. For an unsupported version,
the `auto` detector selects explicit runner dispatch rather than a manual
workaround or a passing claim. Do not scrape interactive cost UI; use only a verified
machine-readable counter if one becomes available.

## Failure taxonomy and handoff

At minimum, record `verification_gate_failed`, `verification_context_invalid`,
`verification_timeout`, `verification_hook_missing`,
`verification_infrastructure_error`, `candidate_changed_after_verification`,
`evaluator_unavailable`, `evaluator_indeterminate`, `quality_bar_missing`,
`quality_bar_changed`, `quality_plateau`, `quality_budget_exhausted`, and
`developer_aborted`. Classify each as product failure, quality gap,
infrastructure failure, or human decision required. None is an approval.

The final handoff includes quality-bar identity/enforcement, verification run
count, evaluation rounds, final candidate fingerprint, largest gaps addressed,
stop reason, residual gap, and reviewer decision. It stores decisions and
evidence references—not agent chain-of-thought or full transcripts.

## Backward compatibility

Cards with `optimization.mode: none` do not invoke an evaluator or require a
quality bar. They retain the original delivery route, optionally using external
verification where configured. This makes Gauntlet adoption card-by-card rather
than a mandatory cost for every feature.
