# <feature ID> — <title>

## Outcome and scope

- Target repository: `<repository ID or integration/local-worktrees>`
- Branch/worktree: `<declared branch and worktree>`
- Outcome: `<observable user or system result>`
- In scope: `<allowed files, behavior, and tests>`
- Out of scope: `<prohibited changes>`
- Dependencies: `<approved card IDs or none>`

## Acceptance criteria

1. `<pass/fail observable criterion>`
2. `<pass/fail observable criterion>`

## Metrics and gates

| ID | Target | Evidence command or observation |
| --- | --- | --- |
| `<metric>` | `<exact target>` | `<command/measurement>` |

- Required gates (`required_gates`): `<gate IDs; additive to globally required gates; empty/absent preserves existing project behavior>`
- Allowed dependencies: `<names or none>`
- Test fixtures/examples: `<paths>`

## Repository skill binding

- Repository policy/router: `<path to the repository router SKILL.md or not applicable>`
- Required skills: `<router, routed skills, and completion skill>`
- Assignment evidence: `<relative SKILL.md paths and SHA-256 values>`

## Optional deterministic scope contract

- Scope contract: `<scope-contracts/<feature ID>.json or not configured>`
- Repository IDs: `<one or more declared repository IDs>`
- Card baseline: `<clean commit captured before the first Developer assignment>`
- The human-readable scope above remains authoritative for semantic review. A
  configured scope contract only permits deterministic changed-path checks.

## Integration, practical test, and risk

- Local-worktree setup: `<not applicable or command>`
- Data/event/callback scenario: `<not applicable or exact scenario>`
- Owner practical test: `<steps and expected result>`
- Risks and rollback: `<known risk and recovery>`
