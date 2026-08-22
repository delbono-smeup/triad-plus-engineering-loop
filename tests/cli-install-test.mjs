import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const fixtureRoot = await mkdtemp(join(tmpdir(), 'triad-plus-cli-'));
const codexHome = join(fixtureRoot, 'codex-home');

try {
  for (const host of ['codex', 'opencode', 'claude-code', 'antigravity']) {
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
      evaluator: { displayName: 'Iris', persona: 'adversarial and evidence-led', model: 'gpt-5.6-terra', reasoning_effort: 'medium' },
      reviewer: { displayName: 'Noah', persona: 'independent and rigorous', model: 'gpt-5.6-terra', reasoning_effort: 'medium' }
    }
  }, null, 2)}\n`);
  const configuredControl = join(fixtureRoot, 'configured-control');
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
  const developerProfile = await readFile(join(configuredCodexHome, 'agents', 'triad_developer.toml'), 'utf8');
  assert.match(developerProfile, /gpt-5\.6-luna/);
  assert.match(developerProfile, /precise and focused/);
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
  process.stdout.write('Triad+ CLI install test passed.\n');
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
