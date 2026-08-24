# Troubleshooting

Run doctor first:

```bash
npx triad-plus doctor --host <runtime> --control /path/to/triad-control
```

`not installed` means the selected adapter assets are absent from that control
workspace. `not installed or version unavailable` for a host means its binary is
not on PATH or otherwise cannot answer `--version`. Re-run the appropriate host
installer or fix the host environment; Triad+ does not require every runtime to
be present.

If a hook is unavailable, use explicit verification dispatch. Hooks are never a
requirement for a normal Triad run.

If a verifier result is `invalid_context`, compare the assignment, PRD/card/gate
baselines, worktree, branch, and candidate. Do not treat it as a passing test.

If Evaluator+ is unavailable, check `roles.evaluator.enabled` in the team file.
An Evaluator+ failure is post-run information, not an automatic repair request.
