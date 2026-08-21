# Delivery handoff — <project ID>

## Decision

`delivered | delivery_blocked | delivered_without_demo`

## Evidence

- PRD baseline: `<source and SHA-256>`
- Approved cards: `<IDs and count>`
- Branches and commits: `<repository: branch @ SHA>`
- Push evidence: `<remote and branches>`
- Gates and metrics: `<summary>`
- Deferred items or waivers: `<none or owner decision>`
- Known risks: `<none or list>`

## Gauntlet quality-loop audit

| Feature | Quality bar / enforcement | Verification runs | Evaluation rounds | Stop | Final candidate fingerprint | Reviewer decision |
| --- | --- | --- | --- | --- | --- | --- |
| `<ID>` | `<none or ID / required|aspirational>` | `<count>` | `<count>` | `<not applicable|reason>` | `<SHA-256>` | `<approved|rework|blocked>` |

- Largest gaps addressed: `<ordered IDs or not applicable>`
- Residual quality gaps: `<none or exact bounded gap and evidence>`
- Evidence/review chain: `<verification/evaluation/review references>`

## Local-worktree integration

| Card | Consumer worktree | Provider worktree | Branch/commit map | Setup command | Data/event/callback gate |
| --- | --- | --- | --- | --- | --- |
| `<not applicable or ID>` | `<path>` | `<path>` | `<repo: branch @ SHA>` | `<command/result>` | `<command/result>` |

Package publication/release: `not performed by this loop`

## Orchestrator exception audit

- Exceptions: `<0 or count>` / `<total cards>`
- Normal roles restored: `<yes/no; evidence>`

| Exception ID | Trigger | Scope | Independent review | Return to normal delegation |
| --- | --- | --- | --- | --- |
| `<none or ID>` | `<reason>` | `<bounded task>` | `<report/waiver>` | `<when/how>` |

## Owner-controlled demo

State: `not_applicable | ready_to_start | active | closed | start_failed`

| Service | Worktree | Command | Local check | Remote URL | Remote check | Process group |
| --- | --- | --- | --- | --- | --- |
| `<id>` | `<path>` | `<command>` | `<not started/pass/fail>` | `<declared URL>` | `<not started/pass/fail>` | `<none or reference>` |

- Start: `<only on owner request>`
- Stop: `<only on owner completion>`
- Closure evidence: `<timestamp, process result, port-release check>`

## Practical test and follow-up

| Feature | Environment | Steps | Expected result | Owner result |
| --- | --- | --- | --- | --- |
| `<ID>` | `<URL or none>` | `<steps>` | `<observable result>` | `to be tested` |

Feedback does not reopen this handoff. Follow-up: `none | feature card <ID> |
successor project <ID> | owner decision required`.
