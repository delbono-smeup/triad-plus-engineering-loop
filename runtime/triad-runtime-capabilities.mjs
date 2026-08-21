#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const option = (name) => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : null;
};

function versionParts(value) {
  const match = String(value).match(/(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}

function atLeast(actual, minimum) {
  const a = versionParts(actual);
  const b = versionParts(minimum);
  if (!a || !b) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] > b[index]) return true;
    if (a[index] < b[index]) return false;
  }
  return true;
}

async function hookConfiguration(pathname) {
  if (!pathname) return { configured: false, reason: "hook_configuration_not_declared", minimum: "0.148.0" };
  try {
    const source = await readFile(pathname, "utf8");
    const parsed = JSON.parse(source);
    if (source.includes("<TRIAD_") || !parsed.hooks?.SubagentStop) {
      return { configured: false, reason: "hook_configuration_contains_placeholders_or_no_subagentstop", minimum: parsed.minimum_codex_cli_version ?? "0.148.0" };
    }
    return { configured: true, reason: null, minimum: parsed.minimum_codex_cli_version ?? "0.148.0" };
  } catch (error) {
    return { configured: false, reason: `hook_configuration_unreadable:${error.code ?? "error"}`, minimum: "0.148.0" };
  }
}

const requestedMode = option("--requested-mode") ?? "auto";
const codexBinary = option("--codex-bin") ?? "codex";
const versionOutput = option("--version-output");
const versionResult = versionOutput ? { status: 0, stdout: versionOutput } : spawnSync(codexBinary, ["--version"], { encoding: "utf8" });
const installedVersion = versionResult.status === 0 ? versionParts(versionResult.stdout)?.join(".") ?? null : null;
const hook = await hookConfiguration(option("--hook-config"));
const asyncAvailable = Boolean(installedVersion && atLeast(installedVersion, hook.minimum));
let selectedMode = "unavailable";
let reason = "verification_runtime_unavailable";
if (requestedMode === "async_hook" && asyncAvailable && hook.configured) {
  selectedMode = "async_hook";
  reason = "validated_async_hook_available";
} else if (requestedMode === "auto" && asyncAvailable && hook.configured) {
  selectedMode = "async_hook";
  reason = "validated_async_hook_available";
} else if (["auto", "explicit_dispatch"].includes(requestedMode)) {
  selectedMode = "explicit_dispatch";
  reason = asyncAvailable ? "async_hook_not_configured" : "async_hook_unavailable_using_explicit_dispatch";
} else if (requestedMode === "async_hook") {
  selectedMode = "explicit_dispatch";
  reason = "async_hook_requested_but_unavailable_using_explicit_dispatch";
}

process.stdout.write(`${JSON.stringify({
  schema_version: 1,
  detected_at: new Date().toISOString(),
  host: "codex",
  codex: { binary: codexBinary, version: installedVersion, async_subagent_stop: { minimum_version: hook.minimum, available: asyncAvailable, configured: hook.configured, configuration_reason: hook.reason } },
  verification: { requested_mode: requestedMode, selected_mode: selectedMode, reason },
}, null, 2)}\n`);
