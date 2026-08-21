import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const fixtureRoot = await mkdtemp(join(tmpdir(), 'triad-plus-cli-'));
const codexHome = join(fixtureRoot, 'codex-home');

try {
  for (const host of ['codex', 'opencode', 'claude-code']) {
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
  process.stdout.write('Triad+ CLI install test passed.\n');
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
