# Evaluator+

Evaluator+ is optional and outside the Triad production loop. Invoke it only
after the Reviewer has approved a feature or delivery.

It receives the goal, acceptance target, final artifact, and verifier evidence.
It should not receive developer reasoning, prior reviewer conversation, or
attempt history unless the owner explicitly requires it. It reports `PASS`,
`FAIL`, or `INDETERMINATE`, with concise evidence references, under
`artifacts/evaluator-plus/`.

An Evaluator+ `FAIL` does not reopen Triad, change the approved state, or start
repair. An owner or a later Orchestrator may use it as input to a new run.
