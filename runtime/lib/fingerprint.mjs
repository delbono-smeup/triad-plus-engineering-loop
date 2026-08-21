import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { runProcess } from "./process.mjs";

const SENSITIVE_PATH = /(^|\/)(?:\.env(?:\..*)?|.*\.pem|.*\.key|credentials(?:\..*)?)$/i;
const IGNORED_PATH = /(^|\/)(?:node_modules|\.git|dist|build|coverage)(\/|$)/;

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseLines(value) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

async function gitLines(worktree, args) {
  const result = await runProcess("git", args, { cwd: worktree, timeoutMs: 15_000 });
  if (result.exitCode !== 0) throw new Error(`git ${args.join(" ")} failed`);
  return parseLines(result.stdout);
}

export async function calculateCandidateFingerprint(worktree) {
  const root = await realpath(worktree);
  const head = (await gitLines(root, ["rev-parse", "HEAD"]))[0] ?? "NO_HEAD";
  const changed = new Set([
    ...(await gitLines(root, ["diff", "--name-only"])),
    ...(await gitLines(root, ["diff", "--cached", "--name-only"])),
    ...(await gitLines(root, ["ls-files", "--others", "--exclude-standard"])),
  ]);
  const files = [];
  for (const relativePath of [...changed].sort()) {
    if (SENSITIVE_PATH.test(relativePath) || IGNORED_PATH.test(relativePath)) continue;
    const absolutePath = path.resolve(root, relativePath);
    if (!absolutePath.startsWith(`${root}${path.sep}`)) throw new Error(`unsafe changed path: ${relativePath}`);
    let contentHash = "DELETED";
    try {
      const metadata = await stat(absolutePath);
      if (metadata.isFile()) contentHash = digest(await readFile(absolutePath));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    files.push({ path: relativePath, sha256: contentHash });
  }
  const canonical = JSON.stringify({ git_head: head, files });
  return { algorithm: "sha256", value: digest(canonical), git_head: head, files };
}
