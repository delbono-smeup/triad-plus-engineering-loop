# <feature ID> — <title>

## Outcome and scope

- Target repository: `<repository ID or integration/local-worktrees>`
- Branch/worktree: `<declared branch and worktree>`
- Outcome: `<observable user or system result>`
- In scope: `<allowed files, behavior, and tests>`
- Out of scope: `<prohibited changes>`
- Dependencies: `<approved card IDs or none>`

## Quality optimization

```yaml
optimization:
  mode: none # none | gauntlet
  quality_bar: null # required when mode is gauntlet
  enforcement: aspirational # required | aspirational when mode is gauntlet
```

- Quality-bar snapshot/hash: `<not applicable or ID, snapshot, SHA-256>`
- Candidate artifacts and observation method: `<paths and exact method>`
- Allowed repair surface: `<smallest surface allowed for one largest-gap repair>`

## Acceptance criteria

1. `<pass/fail observable criterion>`
2. `<pass/fail observable criterion>`

## Metrics and gates

| ID | Target | Evidence command or observation |
| --- | --- | --- |
| `<metric>` | `<exact target>` | `<command/measurement>` |

- Required gates: `<gate IDs>`
- Allowed dependencies: `<names or none>`
- Test fixtures/examples: `<paths>`

## Integration, practical test, and risk

- Local-worktree setup: `<not applicable or command>`
- Data/event/callback scenario: `<not applicable or exact scenario>`
- Owner practical test: `<steps and expected result>`
- Risks and rollback: `<known risk and recovery>`
