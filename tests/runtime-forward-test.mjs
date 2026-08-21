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

function command(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed: ${result.stderr}`);
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function prepare(root, attempt, gateCommand) {
  const worktree = path.join(root, "product");
  await mkdir(worktree, { recursive: true });
  await writeFile(path.join(worktree, "candidate.txt"), "candidate\n");
  command("git", ["init", "-q"], worktree);
  command("git", ["config", "user.email", "triad-test@example.invalid"], worktree);
  command("git", ["config", "user.name", "Triad Test"], worktree);
  command("git", ["add", "."], worktree);
  command("git", ["commit", "-qm", "baseline"], worktree);
  await mkdir(path.join(root, "artifacts"), { recursive: true });
  await mkdir(path.join(root, "features"), { recursive: true });
  await writeFile(path.join(root, "artifacts", "prd.md"), "# PRD\n");
  await writeFile(path.join(root, "features", "TEST-001.md"), "# TEST-001\n");
  const gatesPath = path.join(root, ".loop", "quality-gates.yaml");
  await mkdir(path.dirname(gatesPath), { recursive: true });
  await writeFile(gatesPath, `version: 2\ngates:\n  - id: verification\n    command: ${gateCommand}\n    required: true\n    executor: control-plane\n    timeout_seconds: 10\n`);
  const assignment = {
    schema_version: 1,
    status: "active",
    agent_id: `developer-${attempt}`,
    agent_type: "triad_developer",
    feature_id: "TEST-001",
    attempt,
    project_root: root,
    worktree,
    allow_external_worktree: true,
    prd_path: "artifacts/prd.md",
    card_path: "features/TEST-001.md",
    gates_path: ".loop/quality-gates.yaml",
    expected_prd_sha256: await digest(path.join(root, "artifacts", "prd.md")),
    expected_card_sha256: await digest(path.join(root, "features", "TEST-001.md")),
    expected_gates_sha256: await digest(gatesPath),
    verification_run_id: `run-${attempt}`,
  };
  const assignmentPath = path.join(root, ".loop", "runtime", "assignments", `${assignment.agent_id}.json`);
  await writeJson(assignmentPath, assignment);
  return { assignment, worktree };
}

async function invoke(root, agentId) {
  const result = spawnSync("node", [runner, "--project", root], {
    input: JSON.stringify({ event: "SubagentStop", agent_id: agentId, agent_type: "triad_developer" }),
    encoding: "utf8",
  });
  const output = JSON.parse(result.stdout);
  const evidence = JSON.parse(await readFile(output.evidence, "utf8"));
  return { result, evidence };
}

function detect(host, version, hookConfig) {
  const result = spawnSync("node", [capabilityDetector, "--host", host, "--version-output", `${host} ${version}`, "--hook-config", hookConfig], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "triad-runtime-test-"));
try {
  const hookConfig = path.join(temporaryRoot, "hooks.json");
  await writeJson(hookConfig, { minimum_codex_cli_version: "0.148.0", hooks: { SubagentStop: [{}] } });
  assert.equal(detect("codex", "0.142.0", hookConfig).verification.selected_mode, "explicit_dispatch");
  assert.equal(detect("codex", "0.148.0", hookConfig).verification.selected_mode, "async_hook");
  assert.equal(detect("opencode", "1.18.0", hookConfig).verification.selected_mode, "explicit_dispatch");
  assert.equal(detect("claude-code", "2.1.233", hookConfig).verification.selected_mode, "hook_dispatch");

  const passRoot = path.join(temporaryRoot, "pass");
  const passing = await prepare(passRoot, 1, "true");
  const passRun = await invoke(passRoot, passing.assignment.agent_id);
  assert.equal(passRun.result.status, 0, JSON.stringify(passRun.evidence));
  assert.equal(passRun.evidence.status, "pass");
  assert.equal(passRun.evidence.required_gates_passed, true);
  assert.ok(passRun.evidence.baseline.candidate_fingerprint);

  const failRoot = path.join(temporaryRoot, "fail");
  const failing = await prepare(failRoot, 2, "false");
  const failRun = await invoke(failRoot, failing.assignment.agent_id);
  assert.equal(failRun.result.status, 2);
  assert.equal(failRun.evidence.status, "fail");
  assert.equal(failRun.evidence.gates[0].status, "fail");

  const staleRoot = path.join(temporaryRoot, "stale");
  const mutating = await prepare(staleRoot, 3, "printf changed >> candidate.txt");
  const staleRun = await invoke(staleRoot, mutating.assignment.agent_id);
  assert.equal(staleRun.result.status, 2);
  assert.equal(staleRun.evidence.status, "invalidated");
  assert.equal(staleRun.evidence.failure.code, "candidate_changed_after_verification");

  console.log("Triad runtime forward test passed: capability routing, pass, gate failure, and changed-candidate invalidation.");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
