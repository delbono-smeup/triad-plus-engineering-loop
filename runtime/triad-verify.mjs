#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { access, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeAtomicJson } from "./lib/evidence.mjs";
import { calculateCandidateFingerprint } from "./lib/fingerprint.mjs";
import { executeGates, loadTrustedGates } from "./lib/gates.mjs";

const argv = process.argv.slice(2);
const option = (name) => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : null;
};

async function readStdin() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  return input.trim() ? JSON.parse(input) : {};
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(value) {
  return sha256(await readFile(value));
}

function triggerFrom(payload) {
  return {
    event: payload.event ?? payload.hook_event_name ?? "manual",
    session_id: payload.session_id ?? payload.sessionId ?? null,
    agent_id: payload.agent_id ?? payload.agentId ?? payload?.agent?.id ?? null,
    agent_type: payload.agent_type ?? payload.agentType ?? payload?.agent?.type ?? null,
  };
}

async function resolveAssignment(projectRoot, trigger, explicitAssignment) {
  const assignmentPath = explicitAssignment
    ? path.resolve(explicitAssignment)
    : path.join(projectRoot, ".loop", "runtime", "assignments", `${trigger.agent_id}.json`);
  const assignment = JSON.parse(await readFile(assignmentPath, "utf8"));
  return { assignmentPath, assignment };
}

async function buildInvalidEvidence({ runId, trigger, assignment, reason, outputPath }) {
  const evidence = {
    schema_version: 1,
    run_id: runId,
    feature_id: assignment?.feature_id ?? "unknown",
    attempt: assignment?.attempt ?? null,
    trigger,
    baseline: {
      prd_sha256: assignment?.expected_prd_sha256 ?? null,
      card_sha256: assignment?.expected_card_sha256 ?? null,
      git_head: null,
      candidate_fingerprint: null,
    },
    gates: [],
    required_gates_passed: false,
    status: "invalid_context",
    failure: { code: "verification_context_invalid", reason },
    created_at: new Date().toISOString(),
  };
  if (outputPath) await writeAtomicJson(outputPath, evidence);
  return evidence;
}

async function main() {
  const payload = await readStdin();
  const trigger = triggerFrom(payload);
  const runId = payload.run_id ?? option("--run-id") ?? randomUUID();
  const projectArgument = option("--project") ?? payload.project_root ?? process.cwd();
  const projectRoot = await realpath(projectArgument);
  let assignment;
  let assignmentPath;
  let outputPath;
  try {
    ({ assignmentPath, assignment } = await resolveAssignment(projectRoot, trigger, option("--assignment")));
    const evidenceDirectory = assignment.evidence_directory
      ? path.resolve(projectRoot, assignment.evidence_directory)
      : path.join(projectRoot, ".loop", "evidence", assignment.feature_id, `attempt-${String(assignment.attempt).padStart(3, "0")}`);
    outputPath = path.join(evidenceDirectory, "verification.json");
    if (assignment.status !== "active") throw new Error("assignment is not active");
    if (assignment.agent_id !== trigger.agent_id || assignment.agent_type !== "triad_developer") throw new Error("developer assignment does not match trigger");
    if ((await realpath(path.resolve(assignment.project_root ?? projectRoot))) !== projectRoot) throw new Error("assignment project root mismatch");
    const worktree = await realpath(path.resolve(projectRoot, assignment.worktree));
    if (!worktree.startsWith(`${projectRoot}${path.sep}`) && !assignment.allow_external_worktree) throw new Error("undeclared external worktree");
    const prdPath = path.resolve(projectRoot, assignment.prd_path ?? "artifacts/prd.md");
    const cardPath = path.resolve(projectRoot, assignment.card_path);
    await access(prdPath);
    await access(cardPath);
    if ((await sha256File(prdPath)) !== assignment.expected_prd_sha256) throw new Error("PRD baseline hash mismatch");
    if ((await sha256File(cardPath)) !== assignment.expected_card_sha256) throw new Error("feature card hash mismatch");
    const before = await calculateCandidateFingerprint(worktree);
    const gatesPath = path.resolve(projectRoot, assignment.gates_path ?? ".loop/quality-gates.yaml");
    const trusted = await loadTrustedGates(gatesPath, assignment.expected_gates_sha256);
    if (!trusted.valid) throw new Error("quality gates are missing or changed from their declared hash");
    const logDirectory = path.join(evidenceDirectory, "logs");
    const gates = await executeGates(trusted.gates, worktree, logDirectory);
    const after = await calculateCandidateFingerprint(worktree);
    const candidateChanged = before.value !== after.value;
    const requiredGatesPassed = !candidateChanged && gates.filter((gate) => gate.required).every((gate) => gate.status === "pass");
    const evidence = {
      schema_version: 1,
      run_id: runId,
      feature_id: assignment.feature_id,
      attempt: assignment.attempt,
      trigger,
      assignment_ref: path.relative(projectRoot, assignmentPath),
      baseline: {
        prd_sha256: assignment.expected_prd_sha256,
        card_sha256: assignment.expected_card_sha256,
        gates_sha256: trusted.actualHash,
        git_head: before.git_head,
        candidate_fingerprint: before.value,
      },
      gates,
      required_gates_passed: requiredGatesPassed,
      status: candidateChanged ? "invalidated" : requiredGatesPassed ? "pass" : "fail",
      failure: candidateChanged ? { code: "candidate_changed_after_verification", reason: "worktree changed while gates ran" } : null,
      created_at: new Date().toISOString(),
    };
    await writeAtomicJson(outputPath, evidence);
    process.stdout.write(`${JSON.stringify({ run_id: runId, status: evidence.status, evidence: outputPath })}\n`);
    process.exitCode = evidence.status === "pass" ? 0 : 2;
  } catch (error) {
    const fallbackAssignment = assignment ?? null;
    if (!outputPath && fallbackAssignment?.feature_id) {
      const directory = path.join(projectRoot, ".loop", "evidence", fallbackAssignment.feature_id, `attempt-${String(fallbackAssignment.attempt).padStart(3, "0")}`);
      outputPath = path.join(directory, "verification.json");
    }
    const evidence = await buildInvalidEvidence({ runId, trigger, assignment: fallbackAssignment, reason: error.message, outputPath });
    process.stdout.write(`${JSON.stringify({ run_id: runId, status: evidence.status, evidence: outputPath ?? null })}\n`);
    process.exitCode = 3;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
