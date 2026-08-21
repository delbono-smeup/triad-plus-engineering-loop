import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { redactAndCap, writeLog } from "./evidence.mjs";
import { runProcess } from "./process.mjs";

function scalar(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  if (trimmed === "[]") return [];
  return trimmed.replace(/^['"]|['"]$/g, "");
}

// Supports the deliberately small, list-of-maps YAML contract used by quality-gates.yaml.
export function parseQualityGates(source) {
  try {
    const parsed = JSON.parse(source);
    return parsed.gates ?? [];
  } catch {}
  const gates = [];
  let current = null;
  for (const rawLine of source.split("\n")) {
    const line = rawLine.replace(/\s+#.*$/, "");
    const match = line.match(/^\s*(?:-\s+)?([a-z_]+):\s*(.*?)\s*$/i);
    if (!match) continue;
    const [, key, value] = match;
    const parsedValue = key === "command" || key === "description" ? value.trim().replace(/^['"]|['"]$/g, "") : scalar(value);
    if (line.trimStart().startsWith("- ")) {
      if (current) gates.push(current);
      current = { [key]: parsedValue };
    } else if (current) {
      current[key] = parsedValue;
    }
  }
  if (current) gates.push(current);
  return gates;
}

export async function loadTrustedGates(gatesPath, expectedHash) {
  const source = await readFile(gatesPath, "utf8");
  const actualHash = createHash("sha256").update(source).digest("hex");
  if (!expectedHash || actualHash !== expectedHash) {
    return { valid: false, actualHash, gates: [] };
  }
  return { valid: true, actualHash, gates: parseQualityGates(source) };
}

export async function executeGates(gates, worktree, logDirectory) {
  const results = [];
  for (const gate of gates) {
    const required = gate.required !== false;
    const executor = gate.executor ?? "control-plane";
    if (executor !== "control-plane") {
      results.push({ id: gate.id, required, executor, status: "not_executed", reason: `executor_${executor}_requires_external_evidence` });
      continue;
    }
    if (!gate.id || !gate.command || /^REPLACE_ME/.test(gate.command)) {
      results.push({ id: gate.id ?? "unknown", required, executor, status: "invalid_gate", reason: "missing_trusted_command" });
      continue;
    }
    const startedAt = Date.now();
    const result = await runProcess(gate.command, [], { cwd: worktree, shell: true, timeoutMs: (gate.timeout_seconds ?? 600) * 1000 });
    const stdout = redactAndCap(result.stdout);
    const stderr = redactAndCap(result.stderr);
    const stdoutLog = await writeLog(logDirectory, gate.id, "stdout", result.stdout);
    const stderrLog = await writeLog(logDirectory, gate.id, "stderr", result.stderr);
    results.push({
      id: gate.id,
      required,
      executor,
      status: result.timedOut ? "timeout" : result.exitCode === 0 ? "pass" : "fail",
      exit_code: result.exitCode,
      duration_ms: Date.now() - startedAt,
      stdout_ref: stdoutLog.ref,
      stderr_ref: stderrLog.ref,
      output_truncated: stdout.truncated || stderr.truncated,
    });
  }
  return results;
}
