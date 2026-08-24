# TRIAD v1 — Open Source Release Preparation

## Executive summary

Triad+ is prepared as an open-source release candidate. The feature set remains frozen: Orchestrator, Developer, and Reviewer are the Core; Evaluator+ is optional and post-run. No runtime, capability, publication, tag, or visibility change was introduced.

## Public positioning and README

The README now defines Triad+ as a lightweight engineering loop for coding agents: Developer proposes, Reviewer challenges, and Orchestrator governs. It avoids workflow-platform claims and answers first-minute questions about purpose, supported runtimes, installation, entry points, configuration, limits, contribution, and license.

## Quick Start and documentation

The public copy-paste path is `npx triad-plus init`, then `doctor`, then opening the generated control workspace in the selected host. The final conversation is explicitly manual and host-governed. New focused guides cover getting started, configuration, runtimes, Evaluator+, verification, architecture, and troubleshooting. Historic internal audit and implementation reports were removed from the public tree.

## Runtime compatibility

Codex, Claude Code, OpenCode, Antigravity, and Hermes Agent are documented as peer adapters. All support Core roles and optional Evaluator+. Codex and Claude Code can use validated hooks as an optimization; all adapters retain explicit verification dispatch. Hermes is documented as supported with profile skill discovery and explicit-dispatch behavior stated plainly.

## Evaluator+ and verification

Evaluator+ is documented as an independent post-run assessment, not a Core role, Reviewer replacement, or repair controller. Both `PASS` and `FAIL` leave Triad closed. The verification guide distinguishes agent claims from environment-derived evidence and documents actual verifier guarantees: assignment/candidate binding, control-plane gates, mutation detection, bounded timeout, and evidence.

## Package and license

`package.json` now has public description and MIT license metadata alongside repository, homepage, bug URL, Node.js engine, bin, keywords, scripts, and explicit files. The package includes adapters, runtime, schemas, skills, docs, icon, license, changelog, and contributor/security files. MIT remains the chosen license and is linked from README.

## Contributor, security, and adapter contract

Added concise `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, and `CHANGELOG.md`. Security reporting uses private GitHub advisories when available and otherwise asks for an owner-provided private channel. Contributor and architecture guides require runtime-specific behavior to stay in adapters rather than Core branches.

## CI

Added minimal GitHub Actions CI: checkout, Node 20, `npm test`, `npm run pack:check`, and `git diff --check`. It contains no release, publish, or deployment automation.

## Fresh-user and tarball smoke

A neutral temporary consumer installed the generated tarball with `npm install`, used a neutral team file, and ran package-installed `triad-plus init` plus `doctor` into a fresh control workspace. Prompt, skills, adapter metadata, verifier, neutral configuration, and enabled Evaluator+ were confirmed. The host conversation remains intentionally manual; an isolated end-to-end role/verifier smoke was completed before this package step and no private artifact is included.

## Public-source scan and hygiene

The tracked tree was scanned for credentials, tokens, private user paths, deployment terms, personal agent names, personal model assignments, and historic internal artifacts. No matches remained. No generated smoke file is tracked. `git diff --check` is clean, and `.gitignore` excludes modules, npm logs, tarballs, and local metadata.

## Proposed version

**Proposal: `1.0.0`.** The public Core, adapter contract, installer, verification boundary, package contents, and user documentation are now intended to be stable. This is only a proposal: `package.json` remains `0.1.0` until owner approval.

## Remaining limitations

- Triad+ is not a batch workflow runner; the host agent governs delegation.
- Model binding is limited to facilities exposed by the selected host.
- Hooks are optional and require trusted host configuration.
- Only control-plane verifier gates are supported in v1.

## Owner-authorized release steps

Owner approval is still required for public version, repository visibility and target, tag, npm publication, GitHub Release, and announcement. `RELEASE_CHECKLIST.md` lists these items; no owner-only item is marked complete.

## Final recommendation

**TRIAD v1 — OPEN SOURCE RELEASE CANDIDATE**

**AWAITING OWNER REVIEW**

No publication action was performed.
