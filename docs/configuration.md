# Configuration

`.triad-plus/team.json` separates stable role IDs from user-facing names and
personas. A schema-version-1 configuration has four role records:

```json
{
  "schema_version": 1,
  "interaction": { "language": "English", "owner_name": "Owner", "communication_style": "concise" },
  "roles": {
    "orchestrator": { "displayName": "Coordinator", "persona": "calm and precise", "model": null, "reasoning_effort": null },
    "developer": { "displayName": "Builder", "persona": "methodical", "model": null, "reasoning_effort": null },
    "reviewer": { "displayName": "Critic", "persona": "independent", "model": null, "reasoning_effort": null },
    "evaluator": { "displayName": "Evaluator", "persona": "fresh and evidence-led", "model": null, "reasoning_effort": null, "enabled": false }
  }
}
```

`orchestrator`, `developer`, and `reviewer` are the Core roles. `evaluator` is
optional and enabled only when `roles.evaluator.enabled` is `true`. Omitting that
field is backward-compatible and means Evaluator+ is not configured.

When enabled, Evaluator+ is automatically dispatched by the Orchestrator after
Triad reaches Reviewer approval. It receives a fresh post-run packet and cannot
change the closed Triad result. Set `enabled` to `false` to disable this default.

The runtime adapter is selected per installed control workspace (`--host`). The
team file records role-level models and effort, but an adapter writes those into
host-native profiles only where the host supports that facility. A blank model
means the host default. Never put tokens, API keys, or private deployment data in
this file.
