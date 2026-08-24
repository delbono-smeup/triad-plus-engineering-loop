import { spawn } from "node:child_process";
import process from "node:process";

export function runProcess(command, args = [], options = {}) {
  const { cwd, timeoutMs = 600_000, shell = false, killGraceMs = 2_000 } = options;
  return new Promise((resolve) => {
    const detached = process.platform !== "win32";
    const child = spawn(command, args, { cwd, shell, detached, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let forceTimer;
    const timer = setTimeout(() => {
      timedOut = true;
      signalProcess(child, "SIGTERM", detached);
      forceTimer = setTimeout(() => signalProcess(child, "SIGKILL", detached), killGraceMs);
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => { stderr += `${error.message}\n`; });
    child.on("close", (exitCode, signal) => {
      clearTimeout(timer);
      clearTimeout(forceTimer);
      resolve({ exitCode: exitCode ?? 1, signal, timedOut, stdout, stderr });
    });
  });
}

function signalProcess(child, signal, detached) {
  try {
    if (detached && child.pid) process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    // The process may have exited between the timeout and the escalation.
  }
}
