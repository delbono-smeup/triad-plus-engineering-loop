# Triad Claude Code hook adapter

Claude Code exposes `SubagentStop` with the developer's `agent_id` and
`agent_type`. The optional command hook in `hooks.json` filters exactly
`triad-developer` and invokes the Node verifier. It is a synchronous hook
dispatch: it writes evidence but never owns a Triad state transition.

The file is a configuration fragment, not a settings file to copy blindly.
Replace `<TRIAD_RUNTIME>` and `<TRIAD_CONTROL_ROOT>` with canonical absolute
paths in the actual Claude settings syntax. Confirm its presence with `/hooks`
and validate agent configuration with `claude plugin validate .claude/agents`
where the installed CLI supports it.

With `dispatch_mode: auto`, run:

```bash
node .triad-runtime/triad-runtime-capabilities.mjs \
  --host claude-code \
  --hook-config /absolute/path/to/installed-claude-settings.json
```

An installed `SubagentStop` hook selects `hook_dispatch`. If Claude Code or its
hook is absent, Triad selects `explicit_dispatch`: the orchestrator runs the
same verifier after developer completion. Neither mode permits developer claims
to substitute for verification evidence.
