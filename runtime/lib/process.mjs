import { spawn } from "node:child_process";

export function runProcess(command, args = [], options = {}) {
  const { cwd, timeoutMs = 600_000, shell = false } = options;
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, shell, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => { stderr += `${error.message}\n`; });
    child.on("close", (exitCode, signal) => {
      clearTimeout(timer);
      resolve({ exitCode: exitCode ?? 1, signal, timedOut, stdout, stderr });
    });
  });
}
