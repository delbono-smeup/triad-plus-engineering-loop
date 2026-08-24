# TRIAD — Step 2.1 final fix and release smoke

## 1. Executive summary

Step 2.1 completed live smoke verification without changing the Step 2 model.
Triad remains host-governed with Orchestrator, Developer, and Reviewer. Evaluator+
remains optional, fresh, post-run, and unable to reopen an approved run. No
scheduler, state machine, quality loop, or new role was introduced.

Two local defects were fixed: Hermes profile/path discovery and a verification
gate-parser quoting defect. Both are adapter/runtime fixes, not architecture.

## 2. Hermes environment diagnosis

The Step 2 environment used a non-interactive PATH that omitted the user-local
executable directory. Hermes was installed there and reported version `0.20.5`.
The active Hermes profile uses a profile-specific skills directory. The original
adapter installed user-level skills in the default profile directory, which was
not scanned by the active profile. This was a discovery/configuration issue.

## 3. Hermes live smoke result

The adapter was installed into a temporary control workspace and its skills into
the active Hermes profile. `hermes skills list` reported `triad`,
`triad-loop-developer`, and `triad-loop-evaluator` among the installed skills.

A live one-shot Developer invocation loaded `triad-loop-developer`, received a
bounded task, used explicit terminal `workdir`, read its input, and created the
requested output with exact content `TRIAD_HERMES_SMOKE_OK`. Its final report
confirmed the correct worktree and one created file.

A fresh adapter installation reported Hermes runtime, verifier, and adapter as
OK, and selected `explicit_dispatch`. Hermes remains a peer adapter; Core code
contains no Hermes-specific branch.

## 4. Evaluator+ UX verification

The native entry point starts Triad. Appending `--evaluator` requests Evaluator+
only after Reviewer approval. The entry skill and installation guide expose this
without requiring users to manage packets, schemas, or evidence paths.

| Team configuration | Doctor result | User behavior |
| --- | --- | --- |
| missing or false | `Evaluator+ not configured` | Normal Triad; Orchestrator reports it is disabled. |
| true | `Evaluator+ configured` | An approved result may receive a fresh post-run evaluation. |

The CLI regression test covers both disabled and enabled configurations.

## 5. Evaluator+ PASS smoke

For an already `approved` and `closed` synthetic Triad result, a fresh live
Evaluator+ received only goal, acceptance target, final candidate, and verifier
evidence. It wrote a separate `PASS` report with matching fingerprint, evidence
references, and timestamp. The Triad result remained `approved/closed` and no
assignment was created.

## 6. Evaluator+ FAIL / no-reopen smoke

For a candidate deliberately missing its acceptance phrase, the fresh live
Evaluator+ wrote a separate `FAIL` report. The original Triad result remained
unchanged and closed. No developer assignment, rework, quality loop, or new run
was created (assignment count: zero).

## 7. End-to-end Triad smoke

A temporary Git product repository and separate control workspace contained one
bounded card: create a file with exact content. The configured roles completed:

```text
Orchestrator delegation
  → Developer: one product file created
  → triad-verify: PASS
  → Reviewer: approved
  → Orchestrator: APPROVED
```

Verifier evidence recorded assignment ID/hash, run ID, baseline hashes, candidate
fingerprint, expected branch, and required gate `pass`. Review found that the
candidate file was the sole product change and that its content matched exactly.
No assignment/state mutation, commit, push, or Evaluator+ action was created as
a side effect.

## 8. Private deployment configuration preservation

Role display names, personas, runtime/model choices, and effort settings were
not changed during Step 2.1. SHA-256 checks before and after the smoke matched
for all private role profiles and the private project team configuration. Names,
paths, model assignments, and hashes are intentionally omitted here.

## 9. Doctor diagnostics

Aggregate doctor output distinguished installed from unavailable runtimes. It
detected Codex, OpenCode, Antigravity, and Hermes; it reported Claude Code
unavailable without a system-wide error. A fresh Hermes control workspace
reported valid adapter metadata, Node verifier, and explicit-dispatch capability.
Hook status remains optional and never owns a Triad transition.

## 10. Regression tests

| Check | Outcome |
| --- | --- |
| `npm test` | Passed: registry/capability routing, generic-Core proof, team/model propagation, Evaluator+ enabled/disabled UX, verification pass/fail, stale candidate, wrong assignment/hash/run, timeout, unsupported executor, and installer behavior. |
| `npm run pack:check` | Passed: package contents include runtime, adapters, skills, schemas, docs, README asset, and LICENSE. |
| Public-source scan | Passed: no private deployment names, local user paths, personal assignment data, or credentials in the repository. |
| Diff validation | Passed: `git diff --check` clean. |

## 11. Changes made

- Hermes resolves the active profile skills directory rather than assuming the
  default profile.
- Adapter metadata supports an ordered generic binary-candidate list for
  discovery outside a non-interactive PATH.
- Hermes role instructions require explicit terminal `workdir` and an absolute
  control-workspace report path for Evaluator+.
- The gate parser removes quotes only when they wrap the entire value, preserving
  valid shell commands ending in a quoted argument.
- Documentation explains the optional `--evaluator` path; historic reports were
  neutralized for public-source inspection.

## 12. Remaining limitations

- Hermes has no Triad lifecycle hook and correctly uses explicit verification.
- Host/model identity is verifiable only where a host exposes it.
- Hook fragments still require trusted host configuration with real paths;
  placeholders are intentionally rejected.

## 13. Open-source readiness recommendation

The Step 2.1 smoke fixed the remaining local integration defects. Triad+ is
ready for open-source release preparation. No release, tag, publication, CI/CD
setup, or new feature was performed in this step.
