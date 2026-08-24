#!/usr/bin/env node

import { access, cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { getAdapter, listAdapters, roleDefinitions, sharedSkillNames } from '../adapters/registry.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function usage(exitCode = 0) {
  const stream = exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`Triad+ installer

Usage:
  npx triad-plus
  npx triad-plus init --host <adapter-id> --control <path> [--global] [--team-config <path>] [--allow-product-repo]
  npx triad-plus doctor --host <adapter-id> --control <path> [--hook-config <path>]

Adapters: ${listAdapters().map((adapter) => adapter.id).join(', ')}

The control path is a project-control workspace, not a product repository.
Installation refuses every asset overwrite. Doctor is read-only.
`);
  process.exit(exitCode);
}

function parseArgs(args) {
  const [command, ...rest] = args;
  const options = { command, global: false, allowProductRepo: false };
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument === '--global') options.global = true;
    else if (argument === '--allow-product-repo') options.allowProductRepo = true;
    else if (['--host', '--control', '--team-config', '--hook-config'].includes(argument)) {
      const value = rest[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value.`);
      options[argument.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
      index += 1;
    } else if (argument === '--help' || argument === '-h') usage(0);
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

async function exists(target) {
  try { await access(target); return true; } catch { return false; }
}

async function requireDirectory(target) {
  if (!(await exists(target))) return mkdir(target, { recursive: true });
  if (!(await stat(target)).isDirectory()) throw new Error(`Control path is not a directory: ${target}`);
}

function codexHome() {
  return process.env.CODEX_HOME || join(homedir(), '.codex');
}

function context(controlRoot) {
  return { controlRoot, codexHome: codexHome() };
}

function resolveDestination(destination, root, installContext) {
  const value = typeof destination === 'function' ? destination(installContext) : join(root, destination);
  return resolve(value);
}

function sourcePath(source) {
  return join(packageRoot, source);
}

function planForAssets(assets, root, installContext) {
  const paths = [];
  for (const asset of assets) {
    const destination = resolveDestination(asset.destination, root, installContext);
    if (asset.source === 'shared-skills') {
      paths.push(...sharedSkillNames.map((name) => join(destination, name)));
    } else {
      paths.push(destination);
    }
  }
  return paths;
}

async function copyAsset(asset, root, installContext) {
  const destination = resolveDestination(asset.destination, root, installContext);
  if (asset.source === 'shared-skills') {
    await mkdir(destination, { recursive: true });
    for (const name of sharedSkillNames) await cp(join(packageRoot, 'skills', name), join(destination, name), { recursive: true });
    return;
  }
  await mkdir(dirname(destination), { recursive: true });
  await cp(sourcePath(asset.source), destination, { recursive: !asset.file });
}

async function installAssets(assets, root, installContext) {
  for (const asset of assets) await copyAsset(asset, root, installContext);
}

function teamConfigPath(controlRoot) {
  return join(controlRoot, '.triad-plus', 'team.json');
}

async function loadTeamConfig(options) {
  if (options.team) return options.team;
  if (!options.teamConfig) return null;
  let team;
  try { team = JSON.parse(await readFile(resolve(options.teamConfig), 'utf8')); }
  catch (error) { throw new Error(`Cannot read --team-config: ${error.message}`); }
  if (team?.schema_version !== 1 || !team.interaction || !team.roles) throw new Error('--team-config must contain schema_version 1, interaction, and roles.');
  for (const role of roleDefinitions) {
    const value = team.roles[role.id];
    if (!value || typeof value.displayName !== 'string' || ![null, undefined].includes(value.model) && typeof value.model !== 'string') {
      throw new Error(`--team-config has an invalid ${role.id} role definition.`);
    }
  }
  return team;
}

async function writeTeamConfig(controlRoot, team) {
  const target = teamConfigPath(controlRoot);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(team, null, 2)}\n`, 'utf8');
}

async function applyMarkdownModel(target, model) {
  if (!model) return;
  const source = await readFile(target, 'utf8');
  if (!source.startsWith('---\n')) throw new Error(`Agent definition has no YAML frontmatter: ${target}`);
  const closing = source.indexOf('\n---\n', 4);
  if (closing === -1) throw new Error(`Agent definition has invalid YAML frontmatter: ${target}`);
  const frontmatter = source.slice(4, closing).replace(/^model:\s*.*\n?/m, '');
  await writeFile(target, `---\n${frontmatter}model: ${JSON.stringify(model)}${source.slice(closing)}`, 'utf8');
}

async function writeRoleProfiles(paths, team) {
  await mkdir(dirname(paths[0]), { recursive: true });
  for (const [index, role] of roleDefinitions.entries()) {
    const configuration = team.roles[role.id];
    const instructions = [
      `Act as ${configuration.displayName}, the ${role.label} role in Triad+.`,
      `Persona: ${configuration.persona || 'professional and role-focused'}.`,
      'Read .triad-plus/team.json in the active project-control workspace before working.',
      'Technical role IDs define authority; display names never change it.'
    ].join('\n');
    const profile = [
      `name = ${JSON.stringify(`triad_${role.id}`)}`,
      `description = ${JSON.stringify(`Triad+ ${role.label}: ${configuration.displayName}.`)}`,
      ...(configuration.model ? [`model = ${JSON.stringify(configuration.model)}`] : []),
      ...(configuration.reasoning_effort ? [`model_reasoning_effort = ${JSON.stringify(configuration.reasoning_effort)}`] : []),
      `developer_instructions = ${JSON.stringify(instructions)}`,
      ''
    ].join('\n');
    await writeFile(paths[index], profile, 'utf8');
  }
}

async function applyTeamBinding(adapter, controlRoot, team, installContext) {
  if (!team || adapter.modelBinding === 'team-record') return;
  if (adapter.modelBinding === 'project-frontmatter') {
    const paths = adapter.roleModelPaths(controlRoot, installContext);
    const roles = (adapter.modelRoles ?? roleDefinitions.map((role) => role.id))
      .map((roleId) => roleDefinitions.find((role) => role.id === roleId));
    for (const [index, role] of roles.entries()) await applyMarkdownModel(paths[index], team.roles[role.id].model);
    return;
  }
  if (adapter.modelBinding === 'global-profiles') {
    await writeRoleProfiles(adapter.roleModelPaths(installContext), team);
    return;
  }
  throw new Error(`Unknown model binding: ${adapter.modelBinding}`);
}

function productRepositoryAt(controlRoot) {
  const git = spawnSync('git', ['-C', controlRoot, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (git.status !== 0 || resolve(git.stdout.trim()) !== controlRoot) return false;
  return ['package.json', 'pyproject.toml', 'Cargo.toml', 'pom.xml', 'go.mod', 'Gemfile']
    .some((marker) => spawnSync('test', ['-e', join(controlRoot, marker)]).status === 0);
}

async function collisions(paths) {
  const result = [];
  for (const target of paths) if (await exists(target)) result.push(target);
  return result;
}

function commandVersion(binary) {
  const candidates = Array.isArray(binary) ? binary : [binary];
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
    if (result.status === 0) return String(result.stdout).trim().split('\n')[0];
  }
  return null;
}

async function collectTeamConfiguration(prompt, adapter) {
  const language = (await prompt.question('Conversation language [English]: ')).trim() || 'English';
  const ownerName = (await prompt.question('How should Triad+ address the project owner [Owner]: ')).trim() || 'Owner';
  const communicationStyle = (await prompt.question('Preferred communication style [professional and concise]: ')).trim() || 'professional and concise';
  const evaluatorEnabled = ['y', 'yes'].includes((await prompt.question('Configure optional post-run Evaluator+? [y/N]: ')).trim().toLowerCase());
  const roles = {};
  for (const role of roleDefinitions) {
    const enabled = role.core || evaluatorEnabled;
    const displayName = (await prompt.question(`${role.label} display name [${role.label}]: `)).trim() || role.label;
    const persona = (await prompt.question(`${role.label} persona [professional and role-focused]: `)).trim() || 'professional and role-focused';
    const model = (await prompt.question(`${role.label} model ID [host default]: `)).trim();
    const reasoningEffort = model && adapter.modelBinding === 'global-profiles'
      ? (await prompt.question(`${role.label} reasoning effort [${role.defaultEffort}]: `)).trim() || role.defaultEffort
      : null;
    roles[role.id] = { displayName, persona, model: model || null, reasoning_effort: reasoningEffort, enabled };
  }
  return { schema_version: 1, interaction: { language, owner_name: ownerName, communication_style: communicationStyle }, roles };
}

async function init(options) {
  const adapter = getAdapter(options.host);
  if (!adapter) throw new Error(`Choose --host ${listAdapters().map((item) => item.id).join(', ')}.`);
  if (!options.control) throw new Error('Provide --control <project-control-path>.');
  const team = await loadTeamConfig(options);
  const controlRoot = resolve(options.control);
  await requireDirectory(controlRoot);
  if (!options.allowProductRepo && productRepositoryAt(controlRoot)) {
    throw new Error('Control path appears to be a product repository. Use a separate project-control workspace, or pass --allow-product-repo after reviewing the risk.');
  }
  const installContext = context(controlRoot);
  const planned = [
    ...adapter.projectPaths(controlRoot, installContext),
    ...(team ? [teamConfigPath(controlRoot)] : []),
    ...(options.global ? adapter.globalPaths(installContext) : []),
    ...(team && options.global && adapter.modelBinding === 'global-profiles' ? adapter.roleModelPaths(installContext) : [])
  ];
  const existing = await collisions(planned);
  if (existing.length > 0) throw new Error(`Installation aborted; existing paths would be overwritten:\n${existing.map((target) => `  ${target}`).join('\n')}`);
  await installAssets(adapter.projectAssets, controlRoot, installContext);
  if (team) await writeTeamConfig(controlRoot, team);
  if (team) await applyTeamBinding(adapter, controlRoot, team, installContext);
  if (options.global) await installAssets(adapter.globalAssets, controlRoot, installContext);
  process.stdout.write(`Triad+ installed for ${adapter.label} in ${controlRoot}\n`);
  if (adapter.globalEntry) {
    process.stdout.write(`Install user-level assets with --global to expose ${adapter.entry}.\n`);
  }
  process.stdout.write(`Open the control workspace and use ${adapter.entry} <PRD path>. Evaluator+ is optional and post-run only.\n`);
}

async function doctor(options) {
  if (!options.control) throw new Error('Provide --control <project-control-path>.');
  const controlRoot = resolve(options.control);
  const requested = options.host ? [getAdapter(options.host)] : listAdapters();
  if (requested.some((adapter) => !adapter)) throw new Error(`Choose --host ${listAdapters().map((item) => item.id).join(', ')}.`);
  let team = null;
  if (await exists(teamConfigPath(controlRoot))) {
    try { team = JSON.parse(await readFile(teamConfigPath(controlRoot), 'utf8')); }
    catch { team = 'invalid'; }
  }
  for (const adapter of requested) {
    const installContext = context(controlRoot);
    const absent = [];
    for (const target of adapter.projectPaths(controlRoot, installContext)) if (!(await exists(target))) absent.push(target);
    const binary = commandVersion(adapter.binaryCandidates ?? adapter.binary);
    const node = commandVersion('node');
    const manifestPath = join(controlRoot, '.triad-runtime', 'adapter.json');
    let manifest = false;
    try { manifest = (JSON.parse(await readFile(manifestPath, 'utf8'))?.id === adapter.id); } catch {}
    process.stdout.write(`${adapter.label.padEnd(14)} ${absent.length ? 'not installed' : 'OK'}\n`);
    process.stdout.write(`  Host runtime ${binary ? `OK (${binary})` : 'not installed or version unavailable'}\n`);
    process.stdout.write(`  Verifier     ${node && await exists(join(controlRoot, '.triad-runtime', 'triad-verify.mjs')) ? 'OK' : 'incomplete'}\n`);
    process.stdout.write(`  Adapter      ${manifest ? 'OK' : 'missing or different adapter'}\n`);
    process.stdout.write(`  Team config  ${team === 'invalid' ? 'invalid' : team ? 'OK' : 'not configured'}\n`);
    process.stdout.write(`  Evaluator+   ${team?.roles?.evaluator?.enabled === true ? 'configured' : 'not configured'}\n`);
    if (options.hookConfig && adapter.lifecycle) {
      process.stdout.write(`  Hook config  declared; run runtime capability detection for detailed status\n`);
    }
  }
}

async function interactiveInit() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('The interactive wizard needs a terminal. Use init in a non-interactive shell.');
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  try {
    process.stdout.write('\nTriad+ setup\n');
    listAdapters().forEach((adapter, index) => process.stdout.write(`${index + 1}) ${adapter.label}\n`));
    let adapter;
    while (!adapter) {
      const answer = (await prompt.question(`Choose the host [1-${listAdapters().length}]: `)).trim().toLowerCase();
      adapter = listAdapters()[Number(answer) - 1] ?? getAdapter(answer);
      if (!adapter) process.stdout.write('Choose a listed host.\n');
    }
    const control = (await prompt.question(`Project-control workspace [${join(process.cwd(), 'triad-control')}]: `)).trim() || join(process.cwd(), 'triad-control');
    const global = ['y', 'yes'].includes((await prompt.question(`Also install user-level ${adapter.entry} assets? [y/N]: `)).trim().toLowerCase());
    const team = await collectTeamConfiguration(prompt, adapter);
    const confirm = (await prompt.question('Type install to continue: ')).trim().toLowerCase();
    if (confirm !== 'install') return process.stdout.write('Cancelled. No files were changed.\n');
    await init({ host: adapter.id, control, global, team });
    await doctor({ host: adapter.id, control });
  } finally { prompt.close(); }
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.command === 'init') await init(options);
  else if (options.command === 'doctor') await doctor(options);
  else if (!options.command) await interactiveInit();
  else if (options.command === '--help' || options.command === '-h') usage(0);
  else throw new Error(`Unknown command: ${options.command}`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  usage(2);
}
