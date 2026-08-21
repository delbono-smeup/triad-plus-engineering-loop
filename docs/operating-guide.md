# Triad+ Engineering Loop: Operating Guide

## Purpose

Triad+ Engineering Loop is a controlled way to turn a product requirements
document (PRD) into reviewed, testable, and traceable software changes. It is
designed for projects that may involve one or more product repositories while
keeping planning records and agent evidence outside those repositories.

The method is a loop, not a sequence of optimistic status reports. A feature is
complete only when its acceptance criteria, measurable targets, and required
quality gates have recorded evidence and an independent reviewer accepts that
evidence.

## Roles and authority

| Role | Normal responsibility | Must not do by default |
| --- | --- | --- |
| Project owner | Supplies the PRD, makes product decisions, chooses if and when to open a pull request, starts and ends a demo. | Review every routine decision or approve every feature card manually. |
| Orchestrator | Owns state, sequencing, delegation, evidence, escalation, delivery bookkeeping, and ordinary disagreements. | Become the routine developer or reviewer. |
| Developer | Implements exactly one assigned feature card, adds tests, and reports commands and evidence. | Change scope, decide completion, or review its own work. |
| Evaluator | For a Gauntlet card only, freshly compares the real verified artifact with a concrete quality bar and returns one largest remaining gap. | Implement, approve delivery, or see developer narrative/history during the first judgement. |
| Reviewer | Independently checks the card, diff, tests, metrics, risks, and complete quality trail; recommends approval, rework, or a block. | Review its own implementation or silently waive a required gate. |

Recommended model profiles are configurable rather than intrinsic to the
method. In a Codex deployment, a practical profile is a medium-reasoning
coordinator, a maximum-reasoning implementation agent, and a separate
medium-reasoning reviewer. The runtime must expose those profiles; a written
skill alone cannot force a host to select a model.

The orchestrator is the operational arbiter. It resolves ordinary disagreements
from the PRD, feature card, policy, and evidence. It escalates only when a
decision would alter product intent, acceptance criteria, metrics, required
gates, architecture, security, budget, or accepted risk.

## The lifecycle

```text
PRD baseline
  -> feature plan declared
  -> one ready feature card
  -> development
  -> external verification evidence
  -> optional fresh Gauntlet evaluation
  -> independent review
  -> approved -> next ready card
     rework   -> development again
     blocked  -> owner decision
  -> project delivery and normal branch push
  -> optional owner-controlled demo
```

The plan is shown to the project owner before work begins, but it is not a
manual approval gate. The orchestrator proceeds unless the owner changes the
plan or an escalation condition exists.

## 1. Establish a project control workspace

Create one workspace per initiative outside every product repository. A private
Git repository is recommended for these workspaces. It contains, at minimum:

```text
projects/<project-id>/
  project.yaml
  artifacts/
    prd.md
  .loop/
    feature-plan.md
    work-queue.yaml
    quality-gates.yaml
    decision-policy.md
    run-state.yaml
    features/
    reviews/
    handoffs/
  worktrees/
```

Product source code, product worktrees, generated dependencies, credentials,
and `.env` files do not belong in the control repository.

The `project.yaml` manifest identifies each target repository, its base branch,
one unique project branch, and one project-local worktree. Branches isolate
work; a pull request and merge remain an owner decision.

## 2. Freeze the operational PRD baseline

The PRD may originate from a file, document system, URL, or Git repository. At
bootstrap, copy the approved content to `artifacts/prd.md` and record:

- source reference;
- collection time;
- snapshot path;
- SHA-256 of the snapshot bytes;
- source revision when the source system supplies one.

The snapshot, not a mutable external document, governs the loop. Before each
cycle the orchestrator verifies its SHA-256. A mismatch blocks work; it is never
interpreted as an implicit requirement change.

To change requirements, the owner explicitly re-baselines the PRD. The former
snapshot is preserved, the old and new hashes and source revisions are logged,
and affected cards are identified. If objectives, metrics, or acceptance
criteria change, the orchestrator updates and shows the feature plan before
continuing.

## 3. Decompose the PRD into feature cards

A feature card is the unit of delivery. It has one bounded outcome and defines:

- repository and project branch/worktree;
- scope and excluded work;
- independently observable acceptance criteria;
- measurable targets;
- required commands and quality gates;
- dependencies;
- practical test scenario;
- known risks and rollback considerations.

The feature plan lists every card, its dependencies, gates, metrics, and user
test scenario. The orchestrator selects only one dependency-free card at a time
for a worktree. Parallel work is possible only where worktrees and change
surfaces are genuinely independent.

## 4. Run the development and review loop

For one card, the orchestrator supplies the developer with the PRD excerpt,
card, repository instructions, gate definitions, and known risks. The developer
returns changed files, tests, exact command results, metric evidence, and open
risks.

If a required developer gate fails, the card returns to rework. Passing code is
then given to a fresh reviewer together with the card, diff, evidence, and
previous failures. The reviewer reruns enough checks to independently verify
the claim and recommends one of three outcomes:

| Reviewer result | Orchestrator action |
| --- | --- |
| `approved` | Verify the recorded evidence, commit the card locally, and release the next ready dependency. |
| `rework` | Record the finding and return the same card to the developer. |
| `blocked` | Record the precise decision needed and ask the owner only when it is a true escalation. |

The retry limit is project-configurable. Reaching it does not transform a failed
gate into a pass; it creates a documented escalation.

### Optional Gauntlet quality loop

Correctness and quality optimization are deliberately separate. Every card has
`optimization.mode: none` by default. A `gauntlet` card additionally declares a
snapshotted, hashed quality bar and whether it is `required` or `aspirational`.
The bar is an observable reference—such as a screenshot, golden output,
benchmark, reference implementation, or structured measurable rubric—not a
phrase such as “production ready”.

After the developer stops, an external runner—not the developer report—runs
configured deterministic gates and records atomic evidence for the exact
candidate fingerprint. A changed artifact invalidates the evidence. Only then
does a fresh evaluator receive a minimal, blind packet: outcome, quality bar,
artifact, observation instructions, and passing verification summary. It returns
`candidate_wins`, `bar_wins`, or `indeterminate`; a loss contains one largest
gap and one bounded repair, never a long improvement backlog.

At bootstrap, Triad detects the available verification runtime. In `auto` mode
it uses an installed, trusted async lifecycle hook when supported; otherwise the
orchestrator explicitly invokes the identical runner after developer completion.
Both routes produce the same evidence and neither allows a missing hook to count
as a successful gate.

The orchestrator detects plateau from repeated observable gaps or no measurable
progress, and applies elapsed-time, budget, and safety limits. A required bar
blocks on a non-winning stop unless the owner waives it. An aspirational bar may
go to final review with the residual gap explicitly recorded. The evaluator does
not replace the reviewer. See [Gauntlet evolution](gauntlet-evolution.md) for
the complete contract.

## 5. Exceptional work by the orchestrator

Routine development belongs to the developer and routine review to the
reviewer. If a specialist is unavailable or the harness cannot otherwise make
progress, the orchestrator may perform a bounded hands-on task without waiting
for approval. It must record the trigger, why delegation was not viable, scope,
alternatives, risk, validation plan, and return to normal roles.

Any code written by the orchestrator still needs independent review. An
orchestrator review is supplementary and cannot replace independent review
without an explicit owner waiver. The final handoff audits the number of
exceptions, their scope and evidence, and confirms that normal role delegation
was restored. This is a visibility measure, not an automatic cap.

## 6. Commit, push, and pull requests

After an approved feature card, the orchestrator verifies the staged change
surface and makes one local commit for that card. When all required cards,
project gates, and declared delivery checks pass, it normally pushes every
declared project branch.

The loop never force-pushes. It never creates or updates a pull request unless
the project owner explicitly asks. Package publication, registry version
changes, and releases are separate acts and are not automatic delivery steps.

## 7. Multi-repository work

When repositories exchange data, events, callbacks, services, or component
libraries, create component cards first and a final integration card after
them. The integration card has its own data-flow acceptance criteria and system
gates. It records the exact repository, branch, and commit map used for the
test.

This method uses local worktrees for integration. The consumer is connected to
the provider worktree through an explicitly declared setup command; no registry
artifact is substituted merely to make the test convenient. For example, a web
application consuming a component-library repository can run the consumer's
local-link command, build both worktrees, and exercise a fixture that proves
data input, component event, and host callback behavior. The final integration
card is independently reviewed.

Git hosting remains responsible for merge-conflict detection between distinct
branches. The loop protects only the worktrees and branches it owns; it does not
add path locks that would prevent useful parallel work.

## 8. Delivery, feedback, and demo

After delivery requirements pass, the orchestrator writes a handoff with:

- approved cards, branches, commits, push evidence, and gate results;
- deferred items, waivers, and known risks;
- integration evidence where applicable;
- an exception audit;
- declared demo services and practical test scenarios.

The result is then `delivered`. The owner’s practical test is informative and
does not silently reopen the delivered evidence.

If feedback reports a defect inside the declared scope, the orchestrator creates
a new follow-up card. If it asks for new behavior or a changed objective, it
creates a successor project and asks only for the missing measurable conditions.
The original handoff, reviews, commits, and approval decision are not rewritten.

An optional remote demo is a separate owner-controlled session. Delivery marks
it `ready_to_start` but does not launch a service. Only the owner’s explicit
request starts the declared command. The orchestrator then verifies local and
remote access, records the process group and URL, and leaves it running until
the owner declares the demo finished. It stops only that recorded process group
and verifies that the port is released. There is no automatic time-to-live.

## 9. Minimum evidence standard

Do not claim completion from agent prose alone. A complete record has:

- a stable PRD baseline;
- a feature card with pass/fail criteria;
- exact developer and reviewer evidence;
- required command results against the actual project branch/worktree;
- for configured verification, immutable evidence tied to the active candidate
  fingerprint;
- for Gauntlet cards, quality-bar snapshot/hash, blind evaluation trail, stop
  reason, and any residual gap;
- an independent review decision;
- one commit per approved card;
- normal push evidence at delivery;
- a final handoff and, where relevant, an integration and demo record.

## 10. Owner interaction checklist

The owner normally provides only:

1. project ID, PRD source, target repositories, branches, and measurable goals;
2. an answer to genuine escalation questions;
3. a choice about whether and when to request a pull request or release;
4. a request to start and later end a demo;
5. feedback after delivery, if any.

Everything else—feature sequencing, delegation, rework, independent review,
artifact recording, commits, and normal branch pushes—belongs to the loop.
