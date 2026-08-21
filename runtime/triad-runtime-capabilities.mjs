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

function commandVersion(binary, overriddenOutput) {
  const result = overriddenOutput ? { status: 0, stdout: overriddenOutput } : spawnSync(binary, ["--version"], { encoding: "utf8" });
  return result.status === 0 ? versionParts(result.stdout)?.join(".") ?? null : null;
}

async function codexHookConfiguration(pathname) {
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

const requestedHost = option("--host") ?? "codex";
const requestedMode = option("--requested-mode") ?? "auto";
const versionOutput = option("--version-output");
const host = requestedHost === "auto"
  ? commandVersion(option("--codex-bin") ?? "codex") ? "codex" : "opencode"
  : requestedHost;
if (!['codex', 'opencode'].includes(host)) throw new Error(`unsupported host: ${host}`);

const hostBinary = option(host === "codex" ? "--codex-bin" : "--opencode-bin") ?? host;
const hostVersion = commandVersion(hostBinary, versionOutput);
const nodeVersion = commandVersion(option("--node-bin") ?? "node");
let lifecycle;
if (host === "codex") {
  const hook = await codexHookConfiguration(option("--hook-config"));
  lifecycle = {
    kind: "SubagentStop",
    minimum_version: hook.minimum,
    available: Boolean(hostVersion && atLeast(hostVersion, hook.minimum)),
    configured: hook.configured,
    reason: hook.reason,
  };
} else {
  lifecycle = {
    kind: null,
    minimum_version: null,
    available: false,
    configured: false,
    reason: "no_verified_opencode_async_lifecycle_adapter",
  };
}

const explicitAvailable = Boolean(hostVersion && nodeVersion);
const asyncAvailable = lifecycle.available && lifecycle.configured;
let selectedMode = "unavailable";
let reason = "verification_runtime_unavailable";
if (requestedMode === "async_hook" && asyncAvailable) {
  selectedMode = "async_hook";
  reason = "validated_async_hook_available";
} else if (requestedMode === "auto" && asyncAvailable) {
  selectedMode = "async_hook";
  reason = "validated_async_hook_available";
} else if (explicitAvailable) {
  selectedMode = "explicit_dispatch";
  reason = requestedMode === "async_hook" ? "async_hook_requested_but_unavailable_using_explicit_dispatch" : asyncAvailable ? "explicit_dispatch_requested" : "async_hook_unavailable_using_explicit_dispatch";
}

process.stdout.write(`${JSON.stringify({
  schema_version: 1,
  detected_at: new Date().toISOString(),
  host,
  host_runtime: { binary: hostBinary, version: hostVersion, available: Boolean(hostVersion) },
  verifier_runtime: { binary: option("--node-bin") ?? "node", version: nodeVersion, available: Boolean(nodeVersion) },
  lifecycle_async: lifecycle,
  verification: { requested_mode: requestedMode, selected_mode: selectedMode, reason },
}, null, 2)}\n`);
