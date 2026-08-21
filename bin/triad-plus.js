#!/usr/bin/env node

import { access, cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillNames = [
  'triad-loop-bootstrap',
  'triad-loop-orchestrator',
  'triad-loop-developer',
  'triad-loop-evaluator',
  'triad-loop-reviewer'
];

const hostLabels = {
  codex: 'Codex',
  opencode: 'OpenCode',
  'claude-code': 'Claude Code'
};

const roleDefinitions = [
  { id: 'orchestrator', label: 'Orchestrator', defaultEffort: 'medium' },
  { id: 'developer', label: 'Developer', defaultEffort: 'max' },
  { id: 'evaluator', label: 'Evaluator', defaultEffort: 'medium' },
  { id: 'reviewer', label: 'Reviewer', defaultEffort: 'medium' }
];

function usage(exitCode = 0) {
  const stream = exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`Triad+ Engineering Loop installer

Usage:
  npx triad-plus
  npx triad-plus init --host <codex|opencode|claude-code> --control <path> [--global]
  npx triad-plus doctor --host <codex|opencode|claude-code> --control <path>

Commands:
  (no command)  Open the interactive installation wizard.
  init    Install the selected host adapter, skills, and verification runtime.
          --global also installs the host's user-level command and role assets.
  doctor  Report whether the project installation is complete; it never writes.

The control path is a project-control workspace, not a product repository.
The installer creates it when absent and refuses every overwrite.
`);
  process.exit(exitCode);
}

function parseArgs(args) {
  const [command, ...rest] = args;
  const options = { command, global: false };

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument === '--global') {
      options.global = true;
    } else if (argument === '--host' || argument === '--control' || argument === '--team-config') {
      const value = rest[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} requires a value.`);
      }
      options[argument.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
      index += 1;
    } else if (argument === '--help' || argument === '-h') {
      usage(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

async function loadTeamConfig(options) {
  if (options.team) return options.team;
  if (!options.teamConfig) return null;
  let team;
  try {
    team = JSON.parse(await readFile(resolve(options.teamConfig), 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read --team-config: ${error.message}`);
  }
  if (team?.schema_version !== 1 || !team.interaction || !team.roles) {
    throw new Error('--team-config must contain a Triad+ team.json with schema_version 1.');
  }
  for (const role of roleDefinitions) {
    const configuration = team.roles[role.id];
    if (!configuration || typeof configuration.displayName !== 'string' ||
      ![null, undefined].includes(configuration.model) && typeof configuration.model !== 'string') {
      throw new Error(`--team-config has an invalid ${role.id} role definition.`);
    }
  }
  return team;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function requireDirectory(path) {
  if (!(await exists(path))) {
    await mkdir(path, { recursive: true });
    return;
  }
  if (!(await stat(path)).isDirectory()) {
    throw new Error(`Control path is not a directory: ${path}`);
  }
}

function projectPaths(host, controlRoot) {
  const runtime = [join(controlRoot, '.triad-runtime')];
  const skills = skillNames.map((name) => {
    const base = host === 'codex' ? join(controlRoot, '.agents', 'skills') : join(controlRoot, `.${host === 'claude-code' ? 'claude' : 'opencode'}`, 'skills');
    return join(base, name);
  });

  if (host === 'codex') return [...skills, ...runtime];

  const hostRoot = join(controlRoot, host === 'claude-code' ? '.claude' : '.opencode');
  const agents = host === 'claude-code'
    ? ['triad-developer.md', 'triad-evaluator.md', 'triad-reviewer.md']
    : ['triad-orchestrator.md', 'triad-developer.md', 'triad-evaluator.md', 'triad-reviewer.md'];
  const paths = [
    ...agents.map((name) => join(hostRoot, 'agents', name)),
    join(hostRoot, 'commands', 'triad.md'),
    ...skills,
    ...runtime
  ];
  if (host === 'claude-code') paths.push(join(hostRoot, 'triad-hooks.json'));
  return paths;
}

function globalPaths(host) {
  if (host === 'codex') {
    const codexHome = process.env.CODEX_HOME || join(homedir(), '.codex');
    return [
      join(codexHome, 'prompts', 'triad.md'),
      ...skillNames.map((name) => join(codexHome, 'skills', name))
    ];
  }

  const hostRoot = host === 'claude-code'
    ? join(homedir(), '.claude')
    : join(homedir(), '.config', 'opencode');
  const agents = host === 'claude-code'
    ? ['triad-developer.md', 'triad-evaluator.md', 'triad-reviewer.md']
    : ['triad-orchestrator.md', 'triad-developer.md', 'triad-evaluator.md', 'triad-reviewer.md'];
  return [
    ...agents.map((name) => join(hostRoot, 'agents', name)),
    join(hostRoot, 'commands', 'triad.md'),
    ...skillNames.map((name) => join(hostRoot, 'skills', name))
  ];
}

async function collisions(paths) {
  const result = [];
  for (const path of paths) {
    if (await exists(path)) result.push(path);
  }
  return result;
}

async function copySkills(destination) {
  await mkdir(destination, { recursive: true });
  for (const name of skillNames) {
    await cp(join(packageRoot, 'skills', name), join(destination, name), { recursive: true });
  }
}

async function copyRuntime(controlRoot) {
  const runtimeRoot = join(controlRoot, '.triad-runtime');
  await cp(join(packageRoot, 'runtime'), runtimeRoot, { recursive: true });
  await cp(join(packageRoot, 'schemas'), join(runtimeRoot, 'schemas'), { recursive: true });
}

function teamConfigPath(controlRoot) {
  return join(controlRoot, '.triad-plus', 'team.json');
}

async function writeTeamConfig(controlRoot, team) {
  const destination = teamConfigPath(controlRoot);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(team, null, 2)}\n`, 'utf8');
}

function yamlString(value) {
  return JSON.stringify(value);
}

async function applyMarkdownModel(path, model) {
  if (!model) return;
  const source = await readFile(path, 'utf8');
  if (!source.startsWith('---\n')) throw new Error(`Agent definition has no YAML frontmatter: ${path}`);
  const closing = source.indexOf('\n---\n', 4);
  if (closing === -1) throw new Error(`Agent definition has invalid YAML frontmatter: ${path}`);
  const frontmatter = source.slice(4, closing);
  const body = source.slice(closing);
  const withoutModel = frontmatter.replace(/^model:\s*.*\n?/m, '');
  await writeFile(path, `---\n${withoutModel}model: ${yamlString(model)}${body}`, 'utf8');
}

async function applyHostModelConfiguration(host, controlRoot, team) {
  if (host === 'codex') return;
  const hostRoot = join(controlRoot, host === 'claude-code' ? '.claude' : '.opencode');
  const installedRoles = host === 'claude-code'
    ? ['developer', 'evaluator', 'reviewer']
    : roleDefinitions.map((role) => role.id);
  for (const role of installedRoles) {
    await applyMarkdownModel(join(hostRoot, 'agents', `triad-${role}.md`), team.roles[role].model);
  }
}

function tomlString(value) {
  return JSON.stringify(value);
}

async function writeCodexProfiles(team) {
  const codexHome = process.env.CODEX_HOME || join(homedir(), '.codex');
  const agentsRoot = join(codexHome, 'agents');
  await mkdir(agentsRoot, { recursive: true });
  for (const role of roleDefinitions) {
    const configuration = team.roles[role.id];
    const instructions = [
      `Act as ${configuration.displayName}, the ${role.label} role in Triad+.`,
      'Read .triad-plus/team.json in the active project-control workspace before working.',
      'Use the configured interaction language and owner address. Keep the technical role',
      'boundaries defined by Triad+; display names never change authority or permissions.'
    ].join('\n');
    const profile = [
      `name = ${tomlString(`triad_${role.id}`)}`,
      `description = ${tomlString(`Triad+ ${role.label}: ${configuration.displayName}.`)}`,
      ...(configuration.model ? [`model = ${tomlString(configuration.model)}`] : []),
      ...(configuration.reasoning_effort ? [`model_reasoning_effort = ${tomlString(configuration.reasoning_effort)}`] : []),
      `developer_instructions = ${tomlString(instructions)}`,
      ''
    ].join('\n');
    await writeFile(join(agentsRoot, `triad_${role.id}.toml`), profile, 'utf8');
  }
}

async function installProject(host, controlRoot, team) {
  if (host === 'codex') {
    await copySkills(join(controlRoot, '.agents', 'skills'));
  } else {
    const hostRoot = join(controlRoot, host === 'claude-code' ? '.claude' : '.opencode');
    const sourceRoot = join(packageRoot, 'adapters', host, host === 'claude-code' ? '.claude' : '.opencode');
    await cp(join(sourceRoot, 'agents'), join(hostRoot, 'agents'), { recursive: true });
    await mkdir(join(hostRoot, 'commands'), { recursive: true });
    await cp(join(sourceRoot, 'commands', 'triad.md'), join(hostRoot, 'commands', 'triad.md'));
    await copySkills(join(hostRoot, 'skills'));
    if (host === 'claude-code') {
      await cp(join(packageRoot, 'integrations', 'claude-code', 'hooks.json'), join(hostRoot, 'triad-hooks.json'));
    }
  }
  await copyRuntime(controlRoot);
  if (team) await applyHostModelConfiguration(host, controlRoot, team);
}

async function installGlobal(host, team) {
  if (host === 'codex') {
    const codexHome = process.env.CODEX_HOME || join(homedir(), '.codex');
    await mkdir(join(codexHome, 'prompts'), { recursive: true });
    await cp(join(packageRoot, 'adapters', 'codex', 'prompts', 'triad.md'), join(codexHome, 'prompts', 'triad.md'));
    await copySkills(join(codexHome, 'skills'));
    if (team) await writeCodexProfiles(team);
    return;
  }

  const hostRoot = host === 'claude-code'
    ? join(homedir(), '.claude')
    : join(homedir(), '.config', 'opencode');
  const sourceRoot = join(packageRoot, 'adapters', host, host === 'claude-code' ? '.claude' : '.opencode');
  await cp(join(sourceRoot, 'agents'), join(hostRoot, 'agents'), { recursive: true });
  await mkdir(join(hostRoot, 'commands'), { recursive: true });
  await cp(join(sourceRoot, 'commands', 'triad.md'), join(hostRoot, 'commands', 'triad.md'));
  await copySkills(join(hostRoot, 'skills'));
}

function nextStep(host) {
  return host === 'codex' ? '/prompts:triad' : '/triad';
}

async function collectTeamConfiguration(prompt, host) {
  const language = (await prompt.question('Conversation language [English]: ')).trim() || 'English';
  const ownerName = (await prompt.question('How should Triad+ address the project owner [Owner]: ')).trim() || 'Owner';
  const communicationStyle = (await prompt.question('Preferred communication style [professional and concise]: ')).trim() || 'professional and concise';
  const roles = {};

  process.stdout.write('\nName each role and optionally select its host-native model. Leave a model blank only to use the host default.\n');
  for (const role of roleDefinitions) {
    const displayName = (await prompt.question(`${role.label} display name [${role.label}]: `)).trim() || role.label;
    const model = (await prompt.question(`${role.label} model ID [host default]: `)).trim();
    let reasoningEffort = null;
    if (model && host === 'codex') {
      reasoningEffort = (await prompt.question(`${role.label} reasoning effort [${role.defaultEffort}]: `)).trim() || role.defaultEffort;
    }
    roles[role.id] = {
      displayName,
      model: model || null,
      reasoning_effort: reasoningEffort
    };
  }

  return {
    schema_version: 1,
    interaction: {
      language,
      owner_name: ownerName,
      communication_style: communicationStyle
    },
    roles
  };
}

async function interactiveInit() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('The interactive wizard needs a terminal. Use `init --host <host> --control <path>` in a non-interactive shell.');
  }

  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  try {
    process.stdout.write('\nTriad+ Engineering Loop setup\n');
    process.stdout.write('This installs only into a project-control workspace, never into product repositories.\n\n');
    process.stdout.write('1) Codex\n2) OpenCode\n3) Claude Code\n');

    let host;
    while (!host) {
      const answer = (await prompt.question('Choose the host [1-3]: ')).trim().toLowerCase();
      host = { '1': 'codex', codex: 'codex', '2': 'opencode', opencode: 'opencode', '3': 'claude-code', claude: 'claude-code', 'claude-code': 'claude-code' }[answer];
      if (!host) process.stdout.write('Choose 1, 2, or 3.\n');
    }

    const defaultControl = join(process.cwd(), 'triad-control');
    const controlAnswer = (await prompt.question(`Project-control workspace [${defaultControl}]: `)).trim();
    const control = controlAnswer || defaultControl;
    const globalDefault = host === 'codex' ? 'Y/n' : 'y/N';
    const globalAnswer = (await prompt.question(`Also install user-level ${nextStep(host)} assets? [${globalDefault}]: `)).trim().toLowerCase();
    const global = globalAnswer === '' ? host === 'codex' : ['y', 'yes'].includes(globalAnswer);
    const team = await collectTeamConfiguration(prompt, host);

    process.stdout.write(`\nInstallation summary\n  Host: ${hostLabels[host]}\n  Control workspace: ${resolve(control)}\n  User-level assets: ${global ? 'yes' : 'no'}\n  Language: ${team.interaction.language}\n  Owner: ${team.interaction.owner_name}\n`);
    for (const role of roleDefinitions) {
      const config = team.roles[role.id];
      process.stdout.write(`  ${role.label}: ${config.displayName}; ${config.model || 'host default'}${config.reasoning_effort ? ` (${config.reasoning_effort})` : ''}\n`);
    }
    const confirm = (await prompt.question('Type install to continue: ')).trim().toLowerCase();
    if (confirm !== 'install') {
      process.stdout.write('Cancelled. No files were changed.\n');
      return;
    }

    await init({ host, control, global, team });
    await doctor({ host, control });
  } finally {
    prompt.close();
  }
}

async function init(options) {
  if (!hostLabels[options.host]) throw new Error('Choose --host codex, opencode, or claude-code.');
  if (!options.control) throw new Error('Provide --control <project-control-path>.');

  const team = await loadTeamConfig(options);
  const controlRoot = resolve(options.control);
  await requireDirectory(controlRoot);
  const teamPaths = team ? [teamConfigPath(controlRoot)] : [];
  const codexProfilePaths = team && options.global && options.host === 'codex'
    ? roleDefinitions.map((role) => join(process.env.CODEX_HOME || join(homedir(), '.codex'), 'agents', `triad_${role.id}.toml`))
    : [];
  const planned = [
    ...projectPaths(options.host, controlRoot),
    ...teamPaths,
    ...(options.global ? globalPaths(options.host) : []),
    ...codexProfilePaths
  ];
  const existing = await collisions(planned);
  if (existing.length > 0) {
    throw new Error(`Installation aborted; existing paths would be overwritten:\n${existing.map((path) => `  ${path}`).join('\n')}`);
  }

  await installProject(options.host, controlRoot, team);
  if (team) await writeTeamConfig(controlRoot, team);
  if (options.global) await installGlobal(options.host, team);

  process.stdout.write(`Triad+ installed for ${hostLabels[options.host]} in ${controlRoot}\n`);
  if (!options.global && options.host === 'codex') {
    process.stdout.write('Run again with --global once to install the Codex /prompts:triad entry point.\n');
  }
  if (!options.global && options.host !== 'codex') {
    process.stdout.write('The project-local /triad command is ready. Use --global only if you also want the assets in your user profile.\n');
  }
  if (team && options.host !== 'opencode') {
    process.stdout.write('The Orchestrator model remains the main host session model; Triad+ records its required model and asks for the configured profile at start.\n');
  }
  process.stdout.write(`Open the control workspace, select the recorded Orchestrator model if your host requires it, then run ${nextStep(options.host)} <PRD path>.\n`);
}

async function doctor(options) {
  if (!hostLabels[options.host]) throw new Error('Choose --host codex, opencode, or claude-code.');
  if (!options.control) throw new Error('Provide --control <project-control-path>.');
  const controlRoot = resolve(options.control);
  const absent = [];
  for (const path of projectPaths(options.host, controlRoot)) {
    if (!(await exists(path))) absent.push(path);
  }
  if (absent.length > 0) {
    process.stdout.write(`Triad+ project installation is incomplete:\n${absent.map((path) => `  ${path}`).join('\n')}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`Triad+ project installation is complete for ${hostLabels[options.host]}.\n`);
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.command === 'init') {
    await init(options);
  } else if (options.command === 'doctor') {
    await doctor(options);
  } else if (!options.command) {
    await interactiveInit();
  } else if (options.command === '--help' || options.command === '-h') {
    usage(0);
  } else {
    throw new Error(`Unknown command: ${options.command}`);
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  usage(2);
}
