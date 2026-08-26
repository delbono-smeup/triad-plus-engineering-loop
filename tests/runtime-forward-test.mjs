import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const runner = path.join(repositoryRoot, "runtime", "triad-verify.mjs");
const capabilityDetector = path.join(repositoryRoot, "runtime", "triad-runtime-capabilities.mjs");
const digest = async (file) => createHash("sha256").update(await readFile(file)).digest("hex");
const userFacingIdentityInvariant = "Before the first owner-facing reply, read `.triad-plus/team.json` when it exists.\nUser-facing identity is permanent: adopt its non-empty\n`roles.orchestrator.displayName` as the sole user-facing identity for every\nowner-facing reply, including the first. If the file is absent or has no\nnon-empty display name, use `Triad Orchestrator`; never present a hidden\nintermediary or another Triad role to the owner. You may report delegated roles'\noutputs, but never claim their identity.";

function command(commandName, args, cwd) {
  const result = spawnSync(commandName, args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, `${commandName} ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function prepare(root, attempt, gateCommand, executor = "control-plane") {
  const worktree = path.join(root, "product");
  await mkdir(worktree, { recursive: true });
  await writeFile(path.join(worktree, "candidate.txt"), "candidate\n");
  command("git", ["init", "-q"], worktree);
  command("git", ["config", "user.email", "triad-test@example.invalid"], worktree);
  command("git", ["config", "user.name", "Triad Test"], worktree);
  command("git", ["add", "."], worktree);
  command("git", ["commit", "-qm", "baseline"], worktree);
  const branch = command("git", ["branch", "--show-current"], worktree);
  await mkdir(path.join(root, "artifacts"), { recursive: true });
  await mkdir(path.join(root, "features"), { recursive: true });
  await writeFile(path.join(root, "artifacts", "prd.md"), "# PRD\n");
  await writeFile(path.join(root, "features", "TEST-001.md"), "# TEST-001\n");
  const gatesPath = path.join(root, ".loop", "quality-gates.yaml");
  await mkdir(path.dirname(gatesPath), { recursive: true });
  await writeFile(gatesPath, `version: 2\ngates:\n  - id: verification\n    command: ${gateCommand}\n    required: true\n    executor: ${executor}\n    timeout_seconds: 1\n`);
  const assignment = {
    schema_version: 1, assignment_id: `assignment-${attempt}`, status: "active",
    agent_id: `developer-${attempt}`, agent_type: "triad_developer", feature_id: "TEST-001", attempt,
    project_root: root, worktree, expected_branch: branch, allow_external_worktree: true,
    prd_path: "artifacts/prd.md", card_path: "features/TEST-001.md", gates_path: ".loop/quality-gates.yaml",
    expected_prd_sha256: await digest(path.join(root, "artifacts", "prd.md")),
    expected_card_sha256: await digest(path.join(root, "features", "TEST-001.md")),
    expected_gates_sha256: await digest(gatesPath), verification_run_id: `run-${attempt}`
  };
  const assignmentPath = path.join(root, ".loop", "runtime", "assignments", `${assignment.agent_id}.json`);
  await writeJson(assignmentPath, assignment);
  return { assignment, worktree, assignmentPath };
}

async function invoke(root, agentId, extraArgs = []) {
  const result = spawnSync("node", [runner, "--project", root, ...extraArgs], {
    input: JSON.stringify({ event: "SubagentStop", agent_id: agentId, agent_type: "triad_developer" }), encoding: "utf8", timeout: 10_000
  });
  const output = JSON.parse(result.stdout);
  const evidence = output.evidence ? JSON.parse(await readFile(output.evidence, "utf8")) : null;
  return { result, evidence };
}

function detect(adapter, version, hookConfig) {
  const result = spawnSync("node", [capabilityDetector, "--adapter", path.join(repositoryRoot, "adapters", adapter, "runtime.json"), "--version-output", `${adapter} ${version}`, "--hook-config", hookConfig], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "triad-runtime-test-"));
try {
  const codexHook = path.join(temporaryRoot, "codex-hooks.json");
  const claudeHook = path.join(temporaryRoot, "claude-hooks.json");
  await writeJson(codexHook, { minimum_version: "0.148.0", hooks: { SubagentStop: [{ matcher: "^triad_developer$", hooks: [{ type: "command", command: "node /tmp/triad-verify.mjs --project /tmp", async: true }] }] } });
  await writeJson(claudeHook, { hooks: { SubagentStop: [{ matcher: "^triad-developer$", hooks: [{ type: "command", command: "node /tmp/triad-verify.mjs --project /tmp" }] }] } });
  assert.equal(detect("codex", "0.142.0", codexHook).verification.selected_mode, "explicit_dispatch");
  assert.equal(detect("codex", "0.148.0", codexHook).verification.selected_mode, "async_hook");
  assert.equal(detect("claude-code", "2.1.233", claudeHook).verification.selected_mode, "hook_dispatch");
  for (const adapter of ["opencode", "antigravity", "hermes"]) assert.equal(detect(adapter, "1.0.0", codexHook).verification.selected_mode, "explicit_dispatch");

  const passRoot = path.join(temporaryRoot, "pass");
  const passing = await prepare(passRoot, 1, "test \"$(printf TRIAD_PASS)\" = \"TRIAD_PASS\"");
  const routerPath = path.join(passing.worktree, '.agents', 'skills', 'router', 'SKILL.md');
  await mkdir(path.dirname(routerPath), { recursive: true });
  await writeFile(routerPath, '# Repository skill router\n');
  passing.assignment.required_repository_skills = [{ path: '.agents/skills/router/SKILL.md', sha256: await digest(routerPath) }];
  await writeJson(passing.assignmentPath, passing.assignment);
  const passRun = await invoke(passRoot, passing.assignment.agent_id);
  assert.equal(passRun.result.status, 0, JSON.stringify(passRun.evidence));
  assert.equal(passRun.evidence.status, "pass");
  assert.equal(passRun.evidence.assignment_id, "assignment-1");
  assert.ok(passRun.evidence.assignment_sha256);
  assert.ok(passRun.evidence.baseline.candidate_fingerprint);
  assert.equal(passRun.evidence.repository_skills.declared, true);
  assert.deepEqual(passRun.evidence.repository_skills.skills, passing.assignment.required_repository_skills);

  const repositorySkillMismatchRoot = path.join(temporaryRoot, "repository-skill-mismatch");
  const repositorySkillMismatch = await prepare(repositorySkillMismatchRoot, 11, "true");
  repositorySkillMismatch.assignment.required_repository_skills = [{ path: '.agents/skills/router/SKILL.md', sha256: '0'.repeat(64) }];
  await writeJson(repositorySkillMismatch.assignmentPath, repositorySkillMismatch.assignment);
  const repositorySkillMismatchRun = await invoke(repositorySkillMismatchRoot, repositorySkillMismatch.assignment.agent_id);
  assert.equal(repositorySkillMismatchRun.result.status, 3);
  assert.match(repositorySkillMismatchRun.evidence.failure.reason, /repository skill/);

  const failRoot = path.join(temporaryRoot, "fail");
  const failing = await prepare(failRoot, 2, "false");
  const failRun = await invoke(failRoot, failing.assignment.agent_id);
  assert.equal(failRun.result.status, 2);
  assert.equal(failRun.evidence.gates[0].status, "fail");

  const staleRoot = path.join(temporaryRoot, "stale");
  const mutating = await prepare(staleRoot, 3, "printf changed >> candidate.txt");
  const staleRun = await invoke(staleRoot, mutating.assignment.agent_id);
  assert.equal(staleRun.result.status, 2);
  assert.equal(staleRun.evidence.status, "invalidated");

  const wrongRunRoot = path.join(temporaryRoot, "wrong-run");
  const wrongRun = await prepare(wrongRunRoot, 4, "true");
  const wrongRunResult = await invoke(wrongRunRoot, wrongRun.assignment.agent_id, ["--run-id", "wrong-run"]);
  assert.equal(wrongRunResult.result.status, 3);
  assert.equal(wrongRunResult.evidence.status, "invalid_context");

  const wrongAssignmentRoot = path.join(temporaryRoot, "wrong-assignment");
  const wrongAssignment = await prepare(wrongAssignmentRoot, 7, "true");
  const wrongAssignmentResult = await invoke(wrongAssignmentRoot, "another-developer", ["--assignment", wrongAssignment.assignmentPath]);
  assert.equal(wrongAssignmentResult.result.status, 3);
  assert.match(wrongAssignmentResult.evidence.failure.reason, /does not match trigger/);

  const wrongHashRoot = path.join(temporaryRoot, "wrong-hash");
  const wrongHash = await prepare(wrongHashRoot, 8, "true");
  await writeFile(path.join(wrongHashRoot, "artifacts", "prd.md"), "# changed PRD\n");
  const wrongHashResult = await invoke(wrongHashRoot, wrongHash.assignment.agent_id);
  assert.equal(wrongHashResult.result.status, 3);
  assert.match(wrongHashResult.evidence.failure.reason, /baseline hash mismatch/);

  const unsupportedRoot = path.join(temporaryRoot, "unsupported");
  const unsupported = await prepare(unsupportedRoot, 5, "true", "manual-evidence");
  const unsupportedResult = await invoke(unsupportedRoot, unsupported.assignment.agent_id);
  assert.equal(unsupportedResult.result.status, 2);
  assert.equal(unsupportedResult.evidence.gates[0].status, "unsupported_executor");

  const timeoutRoot = path.join(temporaryRoot, "timeout");
  const timeout = await prepare(timeoutRoot, 6, "trap '' TERM; while true; do :; done");
  const began = Date.now();
  const timeoutResult = await invoke(timeoutRoot, timeout.assignment.agent_id);
  assert.ok(Date.now() - began < 6_000, "timeout must terminate a SIGTERM-ignoring process");
  assert.equal(timeoutResult.result.status, 2);
  assert.equal(timeoutResult.evidence.gates[0].status, "timeout");

  const coreSources = [await readFile(path.join(repositoryRoot, "bin", "triad-plus.js"), "utf8"), await readFile(capabilityDetector, "utf8")].join("\n");
  assert.doesNotMatch(coreSources, /(?:if|switch|===)[\s\S]{0,80}hermes/i);
  const orchestratorContracts = await Promise.all([
    "skills/triad-loop-orchestrator/SKILL.md",
    "adapters/codex/prompts/triad.md",
    "adapters/claude-code/.claude/commands/triad.md",
    "adapters/opencode/.opencode/commands/triad.md",
    "adapters/opencode/.opencode/agents/triad-orchestrator.md",
    "adapters/antigravity/.agents/agents/triad-orchestrator/agent.md",
    "adapters/antigravity/.agents/skills/triad/SKILL.md",
    "adapters/hermes/skills/triad/SKILL.md"
  ].map((file) => readFile(path.join(repositoryRoot, file), "utf8")));
  for (const contract of orchestratorContracts) {
    assert.match(contract, /evaluator\.enabled/i, "configured Evaluator+ must be recognized");
    assert.match(contract, /automatic(?:ally)?/i, "configured Evaluator+ must be automatic");
    assert.match(contract, /(?:never reopens|never reopen|cannot reopen)/i, "Evaluator+ must not reopen Triad");
    assert.ok(contract.includes(userFacingIdentityInvariant), "every adapter must adopt the permanent user-facing Orchestrator identity");
    assert.match(contract, /first owner-facing message/i, "every adapter must require an initial Orchestrator introduction");
  }
  assert.match(orchestratorContracts[0], /Do not ask the owner to continue, pause between cards/i);
  assert.match(orchestratorContracts[0], /required_repository_skills/i);
  assert.match(orchestratorContracts[0], /Developer report is never a human-input wait condition/i);
  assert.match(orchestratorContracts[0], /The normal chain is unattended/i);
  assert.match(orchestratorContracts[0], /informational output, never an\s+implicit pause/i);
  assert.match(orchestratorContracts[0], /## Delivery closure gate/);
  assert.match(orchestratorContracts[0], /`approved` is not an owner delivery/);
  assert.match(orchestratorContracts[0], /Update the control-workspace run record/);
  assert.match(orchestratorContracts[0], /Never present `localhost` as a\s+remote endpoint/);
  assert.match(orchestratorContracts[1], /A Developer report is never a reason to wait\s+for owner input/i);
  const handoffTemplate = await readFile(path.join(repositoryRoot, 'skills', 'triad-loop-bootstrap', 'assets', 'loop-template', 'handoff-report.template.md'), 'utf8');
  const projectTemplate = await readFile(path.join(repositoryRoot, 'skills', 'triad-loop-bootstrap', 'assets', 'project.yaml'), 'utf8');
  assert.match(handoffTemplate, /## Delivery closure record/);
  assert.match(handoffTemplate, /Remote access contract/);
  assert.match(projectTemplate, /remote_access: tailscale/);
  assert.match(projectTemplate, /remote_url:/);
  const runStateTemplate = await readFile(path.join(repositoryRoot, 'skills', 'triad-loop-bootstrap', 'assets', 'loop-template', 'run-state.yaml'), 'utf8');
  assert.match(runStateTemplate, /^delivery:\n  status: not_delivered/m);
  const roleContracts = await Promise.all([
    'skills/triad-loop-developer/SKILL.md',
    'skills/triad-loop-reviewer/SKILL.md',
    'skills/triad-loop-evaluator/SKILL.md'
  ].map((file) => readFile(path.join(repositoryRoot, file), 'utf8')));
  for (const contract of roleContracts) assert.match(contract, /At the beginning of every activation/i);
  const openCodeEvaluator = await readFile(path.join(repositoryRoot, 'adapters/opencode/.opencode/agents/triad-evaluator.md'), 'utf8');
  assert.match(openCodeEvaluator, /Return `PASS`, `FAIL`, or `INDETERMINATE`/);
  assert.doesNotMatch(openCodeEvaluator, /Gauntlet|largest remaining gap/i);
  const evaluatorContract = await readFile(path.join(repositoryRoot, "skills", "triad-loop-evaluator", "SKILL.md"), "utf8");
  assert.match(evaluatorContract, /Do not\s+edit source, change the Triad queue\/state, commit, push/i);
  console.log("Triad runtime tests passed: adapter capabilities, evidence binding, failure handling, hard timeout, and generic Core.");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
