# Triad+ v1.0.0 release report

## Result

**TRIAD+ v1.0.0 — PUBLIC RELEASE**

The public release completed on 2026-08-24.

## Release evidence

- Release commit: `075ddd49c68ad8df9a834c901af2a5384b9beef9` (`release: Triad+ v1.0.0`)
- Public repository: https://github.com/delbono-smeup/triad-plus-engineering-loop
- Default branch: `main`
- Release CI: PASS — https://github.com/delbono-smeup/triad-plus-engineering-loop/actions/runs/32737671904
- Annotated tag: `v1.0.0`, pointing to the release commit
- GitHub Release: https://github.com/delbono-smeup/triad-plus-engineering-loop/releases/tag/v1.0.0
- npm package: `triad-plus@1.0.0`
- npm tarball: https://registry.npmjs.org/triad-plus/-/triad-plus-1.0.0.tgz

## Verification

- `npm test`: PASS
- `npm run pack:check`: PASS
- Public-source and credential scan: PASS
- Generated tarball clean-install smoke: PASS
- Registry clean-install smoke: PASS
  - installed `triad-plus@1.0.0`
  - initialized a neutral Codex control workspace
  - `triad-plus doctor`: host runtime, verifier, adapter, and team configuration all OK

Registry metadata confirms version `1.0.0`, MIT license, package description,
repository/homepage links, and the `triad-plus` executable.

## Post-release documentation correction

`5ca8fb3` restores the existing Triad+ SVG logo in the public README. This is a
documentation-only commit after the immutable `v1.0.0` tag; the published package
and release tag remain unchanged. Its CI is PASS:
https://github.com/delbono-smeup/triad-plus-engineering-loop/actions/runs/32738694239

## Release checklist

- [x] Owner approval and version 1.0.0
- [x] Public repository
- [x] Main branch pushed and green
- [x] Tag `v1.0.0`
- [x] GitHub Release
- [x] npm publication
- [x] Registry smoke
- [ ] External announcement (owner-controlled)

## Warning

GitHub Actions emits a non-blocking notice that its actions are transitioning
away from Node 20. The workflow completed successfully; no release-time change
was made because this is outside the frozen release scope.

## Optional announcement draft

Triad+ v1.0.0 is now public: a lightweight engineering loop for coding agents
with an Orchestrator, Developer, and independent Reviewer, plus an optional
fresh post-run Evaluator+. It supports Codex, Claude Code, OpenCode,
Antigravity, and Hermes Agent. Installation and runtime guidance are in the
README.
