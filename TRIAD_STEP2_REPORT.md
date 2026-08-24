# TRIAD — Step 2 report

## 1. Executive summary

Step 2 realigns Triad+ to a small, host-governed method. The normal Core is now
only Orchestrator, Developer, and Reviewer. Evaluator+ is an optional,
fresh/blind, post-run assessment that cannot change an approved Triad result or
start repair. No daemon, scheduler, state-controller, queue, database, or
automatic evaluation-repair loop was introduced.

## 2. Changes implemented

- Removed the former quality-optimization artifacts, schemas, documentation, and
  templates from the current product surface.
- Simplified role skills, bootstrap records, handoff template, and all host entry
  prompts to the route `ready → in_progress → verifying → in_review → approved |
  rework | blocked`.
- Added an explicit Evaluator+ contract and result schema.
- Added a small registered adapter contract in `adapters/registry.mjs` and
  runtime metadata under `adapters/*/runtime.json`.
- Migrated Codex, OpenCode, Claude Code, and Antigravity installation paths to
  install that metadata; added Hermes as a fifth registered adapter.

## 3. Simplified Triad model

| Role | Actual responsibility | Authority |
| --- | --- | --- |
| Orchestrator | Maintains the goal/context, delegates, chooses the next step, and escalates ambiguity. | Run progression and escalation. |
| Developer | Changes the candidate for one declared feature card. | Bounded implementation report/claim. |
| Reviewer | Inspects the candidate and verifier evidence. | `approved`, `rework`, or `blocked`. |

The runtime stores evidence; it does not advance this model on its own. The
authoritative normal route is documented in `docs/operating-guide.md` and the
three Core skill contracts.

## 4. Evaluator+ behavior

`skills/triad-loop-evaluator/SKILL.md` and
`schemas/evaluator-plus-result.schema.json` define a post-approval report with
`PASS`, `FAIL`, or `INDETERMINATE`. Its permitted input is goal, acceptance
target, final candidate, and verifier evidence. It writes a report under
`artifacts/evaluator-plus/`. The contract expressly excludes production history
and automatic rework; a failure leaves the original Triad result closed.

## 5. Adapter contract

The registry exposes only concrete runtime differences: identifier/label,
binary, native entry point, optional lifecycle metadata, asset destinations,
model-binding mode, and role-asset paths. Generic installer and capability code
consume those descriptors. Legacy `--host` capability invocation remains as a
data-only compatibility shim in `runtime/legacy-adapters.json`.

No `if hermes` (or equivalent Hermes-specific branch) exists in Core installer
or capability logic. Hermes is one descriptor plus adapter assets, as are the
other runtimes.

## 6. Existing-adapter migration and Hermes

| Adapter | Migration evidence |
| --- | --- |
| Codex | Registered metadata, global prompt/profile binding, explicit fallback, validated async-hook capability. |
| OpenCode | Registered metadata, project/global assets and frontmatter model propagation. |
| Claude Code | Registered metadata, project/global assets, frontmatter model propagation, validated hook-dispatch capability. |
| Antigravity | Registered metadata, project/global assets and team-record model contract. |
| Hermes | `adapters/hermes/runtime.json`, `/triad` skill, collision-safe installer, shared skill destination, and explicit dispatch path. |

Hermes’ wrapper uses its native skills and one-shot command model when configured.
The Hermes binary is not installed on this machine, so host detection was tested
with the adapter’s version-output seam rather than a live Hermes session.

## 7. Verification hardening

`runtime/triad-verify.mjs` now requires and records `assignment_id` and the
assignment SHA-256, verifies an optional assignment-bound run ID and expected
worktree branch, and records the branch alongside the fingerprint. This prevents
otherwise valid evidence from being attached to the wrong assignment/candidate.

`runtime/lib/gates.mjs` treats every executor other than `control-plane` as an
explicit `unsupported_executor` failure; manual/MCP evidence is no longer
advertised as a v1 satisfiable required gate. `runtime/lib/process.mjs` now sends
SIGTERM and escalates to SIGKILL after a grace period; on POSIX it targets the
spawned process group so shell descendants do not outlive a timed-out gate.

Verification evidence remains atomic and fail-closed. It is explicitly described
as environment-derived evidence, separate from agent-reported claims.

## 8. Configuration and backward compatibility

Schema-version-1 `team.json` remains valid. Role ID, display name/persona,
runtime model, and supported effort/options are preserved. New interactive setup
adds `roles.evaluator.enabled`; absence is interpreted as optional Evaluator+
not configured, without rewriting legacy data.

### Nazarick preservation confirmation

No Nazarick configuration file was modified. Before/after SHA-256 checks were
identical for:

| Role | Display name | Model / effort | Configuration evidence |
| --- | --- | --- | --- |
| Orchestrator | Sebas | `gpt-5.6-terra` / `medium` | `.codex/agents/triad_orchestrator.toml` — `ba35f7…fa615` |
| Developer | Solution | `gpt-5.6-luna` / `max` | `.codex/agents/triad_developer.toml` — `e4c701…b7b0` |
| Reviewer | Yuri | `gpt-5.6-terra` / `medium` | `.codex/agents/triad_reviewer.toml` — `90791d…c2ca9` |
| Evaluator+ | Lupusregina | `gpt-5.6-terra` / `medium` | `.codex/agents/triad_evaluator.toml` — `27ad3f…25870` |

The existing project team file was also unchanged: `agent-jsonform/.triad-plus/team.json` — `4560d0…dde6a`.

## 9. UX, packaging, and documentation

`npx triad-plus init` retains interactive setup; non-interactive installation
accepts reviewed team configuration. It refuses collisions and detects a likely
product Git repository unless the caller deliberately supplies
`--allow-product-repo`. `doctor` now reports all adapters when no host is named,
and reports host binary, verifier, adapter metadata, team validity, and optional
Evaluator+ configuration.

The package now includes `LICENSE`, documentation, and the README icon asset.
Public documentation is aligned to the actual method and includes a five-runtime
compatibility matrix. Historic local naming and stale quality-loop claims were
removed from public materials.

## 10. Tests executed

| Command / check | Outcome |
| --- | --- |
| `npm test` | Passed: capability routing for all five adapters, verification pass/fail, stale candidate invalidation, wrong assignment/run/hash rejection, unsupported gate executor, SIGTERM-ignoring timeout, generic-Core Hermes proof, installer/model propagation tests. |
| `npm run pack:check` | Passed: dry-run package includes adapter assets, runtime, schemas, skills, docs, icon, README, and LICENSE. |
| `node bin/triad-plus.js doctor --control /tmp/triad-doctor-empty` | Passed: readable five-runtime diagnostic matrix; expected uninstalled state in an empty workspace. |
| `rg` audit for removed concepts | Passed outside immutable `TRIAD_CURRENT_STATE.md`: no Gauntlet/plateau/largest-gap/quality-rework terms remain. |
| Nazarick configuration hashes | Passed: five tracked external configuration files unchanged. |

## 11. Remaining limitations

- Hermes live invocation could not be exercised because its binary is absent on
  Nazarick; the adapter is installation- and capability-tested only.
- Hook fragments remain templates requiring trusted host configuration with real
  absolute paths. The capability detector intentionally rejects placeholders.
- Triad+ does not attempt to infer a host’s actual active model where that host
  does not expose it; it preserves the requested contract and the Orchestrator
  reports unverifiable/mismatched configuration.

## 12. Deferred ideas

No largest-gap controller, plateau detection, scoring, multi-reviewer voting,
memory, supervisor, dynamic routing, collaboration stream, or evaluator-driven
repair was added. These remain outside Step 2.

## 13. Recommendation

Triad+ is ready for Step 2 review and substantially closer to open-source use:
the public method is smaller, runtime selection is adapter-driven, verification
is stricter, and configuration is backward-compatible. A live Hermes smoke test
after installing Hermes Agent is the only material host-specific follow-up.
