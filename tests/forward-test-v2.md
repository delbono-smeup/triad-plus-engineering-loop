# Triad Gauntlet V2 forward test

Run from the repository root:

```bash
node tests/runtime-forward-test.mjs
npx --yes skills-ref@latest validate skills/triad-loop-evaluator
```

The executable test creates disposable control/worktree pairs and proves these
new control-plane properties without a model or a product repository:

| Scenario | Expected result | Automated evidence |
| --- | --- | --- |
| Runtime routing | Older/unconfigured Codex and OpenCode select explicit dispatch; supported configured Codex selects async hook. | `runtime-forward-test.mjs`: capability cases. |
| Valid developer completion | Atomic evidence is `pass` with a candidate fingerprint. | `runtime-forward-test.mjs`: pass case. |
| Required gate failure | Evidence is `fail`; it cannot be mistaken for success. | `runtime-forward-test.mjs`: failing-gate case. |
| Artifact changes while a gate runs | Evidence is `invalidated` with `candidate_changed_after_verification`. | `runtime-forward-test.mjs`: mutating-gate case. |
| Evaluator contract | New skill and result schema require fresh/blind input and one largest gap. | `skills-ref` validation plus `schemas/evaluation-result.schema.json`. |
| Backward compatibility | `optimization.mode: none` remains in the feature-card and queue templates. | Template inspection. |

For a host deployment, perform the following observed run before production use:

1. create one `gauntlet` card with a snapshotted bar and a safety ceiling;
2. dispatch the developer and confirm an assignment appears before it runs;
3. confirm the Codex `SubagentStop` hook (only on a validated CLI `>= 0.148.0`)
   writes evidence without developer intervention;
4. make the candidate lose once, inspect that the fresh evaluator packet excludes
   developer narrative/history, and confirm exactly one `bar_wins` gap;
5. repair only that gap and confirm a new fingerprint, verification run, and new
   evaluator session;
6. exercise aspirational plateau and required plateau separately; only the first
   may enter final review with a residual gap;
7. inject an engineering defect after `candidate_wins` and confirm final review
   returns `rework`.

On Nazarick at implementation time, the installed Codex CLI is `0.142.0`; this
is below the lifecycle-hook adapter's declared `0.148.0` minimum. The automated
runner test is therefore real, while the live `SubagentStop` dispatch is
intentionally not claimed as executed. Upgrade and schema/trust validation are
required before enabling that hook.
