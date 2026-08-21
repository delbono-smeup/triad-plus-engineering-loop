# Triad Codex hook adapter

This adapter is for Codex CLI 0.148.0 or newer. It dispatches the Node
verification runner when a subagent whose type is exactly `triad_developer`
stops. It is deliberately an asynchronous command hook: it writes immutable
evidence and has no authority to approve, reject, or transition a feature card.

## Install only after verifying the local Codex schema

The included `hooks.json` is a versioned configuration fragment, not a global
configuration file to copy blindly. Replace these placeholders with canonical
absolute paths in the configuration syntax accepted by the installed CLI:

- `<TRIAD_RUNTIME>`: the cloned repository's `runtime` directory;
- `<TRIAD_CONTROL_ROOT>`: the project-control repository containing `.loop/`.

Before enabling it, verify all of the following:

1. `codex --version` is at least `0.148.0`.
2. The local CLI accepts the `SubagentStop` async command-hook schema.
3. The project-local hook source is trusted by the Codex installation.
4. Developer assignments use `agent_type: triad_developer` and are written
   before the subagent starts.
5. Gate commands are in the hashed, trusted `.loop/quality-gates.yaml`.

Do not use this fragment for `mcp_tool` execution. MCP hooks are synchronous and
optional; long verification remains in the async command runner. A missing,
aborted, or unsupported hook must be detected by the orchestrator watchdog and
recorded as `verification_hook_missing`, `developer_aborted`, or
`verification_timeout`; it must never silently create a passing result.

## Direct, auditable fallback

Until the lifecycle hook is supported and verified, dispatch the same runner
explicitly after developer completion:

```bash
node /absolute/path/to/triad-engineering-loop/runtime/triad-verify.mjs \
  --project /absolute/path/to/project-control < hook-payload.json
```

The JSON payload needs an `agent_id` matching an active assignment under
`.loop/runtime/assignments/`. The runner resolves all semantic data from that
assignment and emits only structured evidence. The orchestrator still validates
the evidence against the active candidate before changing state.
