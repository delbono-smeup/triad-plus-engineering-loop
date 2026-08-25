import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const fixtureRoot = await mkdtemp(join(tmpdir(), 'triad-plus-cli-'));
const codexHome = join(fixtureRoot, 'codex-home');
const userFacingIdentityInvariant = "Before the first owner-facing reply, read `.triad-plus/team.json` when it exists.\nUser-facing identity is permanent: adopt its non-empty\n`roles.orchestrator.displayName` as the sole user-facing identity for every\nowner-facing reply, including the first. If the file is absent or has no\nnon-empty display name, use `Triad Orchestrator`; never present a hidden\nintermediary or another Triad role to the owner. You may report delegated roles'\noutputs, but never claim their identity.";

try {
  for (const host of ['codex', 'opencode', 'claude-code', 'antigravity', 'hermes']) {
    const controlRoot = join(fixtureRoot, host, 'control');
    const cliArgs = ['bin/triad-plus.js', 'init', '--host', host, '--control', controlRoot];
    if (host === 'codex') cliArgs.push('--global');
    const first = spawnSync(process.execPath, cliArgs, {
      cwd: repositoryRoot,
      env: { ...process.env, CODEX_HOME: codexHome },
      encoding: 'utf8'
    });
    assert.equal(first.status, 0, first.stderr);
    const doctor = spawnSync(process.execPath, [
      'bin/triad-plus.js', 'doctor', '--host', host, '--control', controlRoot
    ], { cwd: repositoryRoot, encoding: 'utf8' });
    assert.equal(doctor.status, 0, doctor.stderr);
  }
  const controlRoot = join(fixtureRoot, 'codex', 'control');
  const second = spawnSync(process.execPath, [
    'bin/triad-plus.js', 'init', '--host', 'codex', '--control', controlRoot, '--global'
  ], {
    cwd: repositoryRoot,
    env: { ...process.env, CODEX_HOME: codexHome },
    encoding: 'utf8'
  });
  assert.equal(second.status, 2, second.stderr);
  assert.match(second.stderr, /would be overwritten/);
  const nonInteractiveWizard = spawnSync(process.execPath, ['bin/triad-plus.js'], {
    cwd: repositoryRoot,
    encoding: 'utf8'
  });
  assert.equal(nonInteractiveWizard.status, 2, nonInteractiveWizard.stderr);
  assert.match(nonInteractiveWizard.stderr, /interactive wizard needs a terminal/);

  const teamConfigSource = join(fixtureRoot, 'team.json');
  await writeFile(teamConfigSource, `${JSON.stringify({
    schema_version: 1,
    interaction: {
      language: 'Italian',
      owner_name: 'Martina',
      communication_style: 'direct'
    },
    roles: {
      orchestrator: { displayName: 'Ada', persona: 'calm and exact', model: 'gpt-5.6-terra', reasoning_effort: 'medium' },
      developer: { displayName: 'Lin', persona: 'precise and focused', model: 'gpt-5.6-luna', reasoning_effort: 'max' },
      evaluator: { displayName: 'Iris', persona: 'adversarial and evidence-led', model: 'gpt-5.6-terra', reasoning_effort: 'medium', enabled: false },
      reviewer: { displayName: 'Noah', persona: 'independent and rigorous', model: 'gpt-5.6-terra', reasoning_effort: 'medium' }
    }
  }, null, 2)}\n`);
  const configuredControl = join(fixtureRoot, 'configured-codex-control');
  const configuredCodexHome = join(fixtureRoot, 'configured-codex-home');
  const configured = spawnSync(process.execPath, [
    'bin/triad-plus.js', 'init', '--host', 'codex', '--control', configuredControl,
    '--global', '--team-config', teamConfigSource
  ], {
    cwd: repositoryRoot,
    env: { ...process.env, CODEX_HOME: configuredCodexHome },
    encoding: 'utf8'
  });
  assert.equal(configured.status, 0, configured.stderr);
  assert.match(await readFile(join(configuredControl, '.triad-plus', 'team.json'), 'utf8'), /"Italian"/);
  assert.match(await readFile(join(configuredControl, '.triad-plus', 'team.json'), 'utf8'), /"enabled": false/);
  assert.ok((await readFile(join(configuredCodexHome, 'prompts', 'triad.md'), 'utf8')).includes(userFacingIdentityInvariant));
  assert.match(await readFile(join(configuredCodexHome, 'prompts', 'triad.md'), 'utf8'), /first owner-facing message/i);
  assert.match(await readFile(join(configuredCodexHome, 'prompts', 'triad.md'), 'utf8'), /--hook-config \.codex\/hooks\.json/);
  const developerProfile = await readFile(join(configuredCodexHome, 'agents', 'triad_developer.toml'), 'utf8');
  assert.match(developerProfile, /gpt-5\.6-luna/);
  assert.match(developerProfile, /precise and focused/);
  const instructionPath = join(configuredControl, 'AGENTS.md');
  assert.match(await readFile(instructionPath, 'utf8'), /Orchestrator is `Ada` for this run/);
  await writeFile(instructionPath, `${await readFile(instructionPath, 'utf8')}\n## Owner note\nKeep this note.\n`);
  const stalePrompt = join(configuredCodexHome, 'prompts', 'triad.md');
  await writeFile(stalePrompt, 'stale prompt\n');
  const plannedUpgrade = spawnSync(process.execPath, [
    'bin/triad-plus.js', 'upgrade', '--host', 'codex', '--control', configuredControl, '--global'
  ], { cwd: repositoryRoot, env: { ...process.env, CODEX_HOME: configuredCodexHome }, encoding: 'utf8' });
  assert.equal(plannedUpgrade.status, 0, plannedUpgrade.stderr);
  assert.match(plannedUpgrade.stdout, /Dry run only/);
  assert.equal(await readFile(stalePrompt, 'utf8'), 'stale prompt\n');
  const appliedUpgrade = spawnSync(process.execPath, [
    'bin/triad-plus.js', 'upgrade', '--host', 'codex', '--control', configuredControl, '--global', '--apply'
  ], { cwd: repositoryRoot, env: { ...process.env, CODEX_HOME: configuredCodexHome }, encoding: 'utf8' });
  assert.equal(appliedUpgrade.status, 0, appliedUpgrade.stderr);
  assert.ok((await readFile(stalePrompt, 'utf8')).includes(userFacingIdentityInvariant));
  assert.match(await readFile(stalePrompt, 'utf8'), /first owner-facing message/i);
  assert.match(await readFile(instructionPath, 'utf8'), /Keep this note/);
  assert.match(await readFile(instructionPath, 'utf8'), /triad-plus:managed-instructions:start/);
  assert.equal(await readFile(join(configuredControl, '.triad-plus', 'team.json'), 'utf8'), await readFile(teamConfigSource, 'utf8'));
  assert.ok((await stat(join(configuredControl, '.triad-plus', 'backups'))).isDirectory());
  const shippedCodexHooks = JSON.parse(await readFile(join(repositoryRoot, 'integrations', 'codex', 'hooks.json'), 'utf8'));
  assert.equal(typeof shippedCodexHooks.description, 'string');
  assert.equal('minimum_codex_cli_version' in shippedCodexHooks, false);
  assert.equal('purpose' in shippedCodexHooks, false);
  for (const host of ['opencode', 'claude-code']) {
    const control = join(fixtureRoot, `${host}-configured-control`);
    const result = spawnSync(process.execPath, [
      'bin/triad-plus.js', 'init', '--host', host, '--control', control,
      '--team-config', teamConfigSource
    ], { cwd: repositoryRoot, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const hostDirectory = host === 'opencode' ? '.opencode' : '.claude';
    assert.match(
      await readFile(join(control, hostDirectory, 'agents', 'triad-developer.md'), 'utf8'),
      /model: "gpt-5\.6-luna"/
    );
    assert.ok((await readFile(join(control, hostDirectory, 'commands', 'triad.md'), 'utf8')).includes(userFacingIdentityInvariant));
  }
  const antigravityControl = join(fixtureRoot, 'antigravity-configured-control');
  const antigravity = spawnSync(process.execPath, [
    'bin/triad-plus.js', 'init', '--host', 'antigravity', '--control', antigravityControl,
    '--team-config', teamConfigSource
  ], { cwd: repositoryRoot, encoding: 'utf8' });
  assert.equal(antigravity.status, 0, antigravity.stderr);
  assert.match(
    await readFile(join(antigravityControl, '.agents', 'agents', 'triad-developer', 'agent.md'), 'utf8'),
    /Load `triad-loop-developer`/
  );
  assert.match(
    await readFile(join(antigravityControl, '.agents', 'skills', 'triad', 'SKILL.md'), 'utf8'),
    /Triad\+ workflow/
  );
  assert.ok((await readFile(join(antigravityControl, '.agents', 'skills', 'triad', 'SKILL.md'), 'utf8')).includes(userFacingIdentityInvariant));
  const antigravityHome = join(fixtureRoot, 'antigravity-home');
  const antigravityGlobalControl = join(fixtureRoot, 'antigravity-global-control');
  const globalAntigravity = spawnSync(process.execPath, [
    'bin/triad-plus.js', 'init', '--host', 'antigravity', '--control', antigravityGlobalControl, '--global'
  ], {
    cwd: repositoryRoot,
    env: { ...process.env, HOME: antigravityHome },
    encoding: 'utf8'
  });
  assert.equal(globalAntigravity.status, 0, globalAntigravity.stderr);
  await readFile(join(antigravityHome, '.gemini', 'config', 'agents', 'triad-reviewer', 'agent.md'), 'utf8');
  await readFile(join(antigravityHome, '.gemini', 'config', 'skills', 'triad', 'SKILL.md'), 'utf8');
  const hermesControl = join(fixtureRoot, 'hermes-configured-control');
  const hermes = spawnSync(process.execPath, [
    'bin/triad-plus.js', 'init', '--host', 'hermes', '--control', hermesControl, '--global', '--team-config', teamConfigSource
  ], { cwd: repositoryRoot, env: { ...process.env, HERMES_HOME: join(fixtureRoot, 'hermes-home') }, encoding: 'utf8' });
  assert.equal(hermes.status, 0, hermes.stderr);
  await readFile(join(hermesControl, '.triad-runtime', 'adapter.json'), 'utf8');
  assert.ok((await readFile(join(fixtureRoot, 'hermes-home', 'skills', 'triad', 'SKILL.md'), 'utf8')).includes(userFacingIdentityInvariant));
  const evaluatorEnabledSource = join(fixtureRoot, 'team-evaluator-enabled.json');
  const evaluatorEnabled = JSON.parse(await readFile(teamConfigSource, 'utf8'));
  evaluatorEnabled.roles.evaluator.enabled = true;
  await writeFile(evaluatorEnabledSource, `${JSON.stringify(evaluatorEnabled, null, 2)}\n`);
  const evaluatorEnabledControl = join(fixtureRoot, 'evaluator-enabled-control');
  const enabledInstall = spawnSync(process.execPath, [
    'bin/triad-plus.js', 'init', '--host', 'hermes', '--control', evaluatorEnabledControl, '--team-config', evaluatorEnabledSource
  ], { cwd: repositoryRoot, encoding: 'utf8' });
  assert.equal(enabledInstall.status, 0, enabledInstall.stderr);
  const enabledDoctor = spawnSync(process.execPath, [
    'bin/triad-plus.js', 'doctor', '--host', 'hermes', '--control', evaluatorEnabledControl
  ], { cwd: repositoryRoot, encoding: 'utf8' });
  assert.equal(enabledDoctor.status, 0, enabledDoctor.stderr);
  assert.match(enabledDoctor.stdout, /Evaluator\+\s+configured/);
  process.stdout.write('Triad+ CLI install test passed.\n');
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
