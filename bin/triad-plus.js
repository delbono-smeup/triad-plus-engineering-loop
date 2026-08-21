#!/usr/bin/env node

import { access, cp, mkdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';

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

function usage(exitCode = 0) {
  const stream = exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`Triad+ Engineering Loop installer

Usage:
  npx triad-plus init --host <codex|opencode|claude-code> --control <path> [--global]
  npx triad-plus doctor --host <codex|opencode|claude-code> --control <path>

Commands:
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
    } else if (argument === '--host' || argument === '--control') {
      const value = rest[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} requires a value.`);
      }
      options[argument.slice(2)] = value;
      index += 1;
    } else if (argument === '--help' || argument === '-h') {
      usage(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
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

async function installProject(host, controlRoot) {
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
}

async function installGlobal(host) {
  if (host === 'codex') {
    const codexHome = process.env.CODEX_HOME || join(homedir(), '.codex');
    await mkdir(join(codexHome, 'prompts'), { recursive: true });
    await cp(join(packageRoot, 'adapters', 'codex', 'prompts', 'triad.md'), join(codexHome, 'prompts', 'triad.md'));
    await copySkills(join(codexHome, 'skills'));
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

async function init(options) {
  if (!hostLabels[options.host]) throw new Error('Choose --host codex, opencode, or claude-code.');
  if (!options.control) throw new Error('Provide --control <project-control-path>.');

  const controlRoot = resolve(options.control);
  await requireDirectory(controlRoot);
  const planned = [...projectPaths(options.host, controlRoot), ...(options.global ? globalPaths(options.host) : [])];
  const existing = await collisions(planned);
  if (existing.length > 0) {
    throw new Error(`Installation aborted; existing paths would be overwritten:\n${existing.map((path) => `  ${path}`).join('\n')}`);
  }

  await installProject(options.host, controlRoot);
  if (options.global) await installGlobal(options.host);

  process.stdout.write(`Triad+ installed for ${hostLabels[options.host]} in ${controlRoot}\n`);
  if (!options.global && options.host === 'codex') {
    process.stdout.write('Run again with --global once to install the Codex /prompts:triad entry point.\n');
  }
  if (!options.global && options.host !== 'codex') {
    process.stdout.write('The project-local /triad command is ready. Use --global only if you also want the assets in your user profile.\n');
  }
  process.stdout.write(`Configure the four role profiles for your host, open the control workspace, then run ${nextStep(options.host)} <PRD path>.\n`);
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
  } else if (!options.command || options.command === '--help' || options.command === '-h') {
    usage(0);
  } else {
    throw new Error(`Unknown command: ${options.command}`);
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  usage(2);
}
