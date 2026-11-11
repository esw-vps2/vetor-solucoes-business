import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('worker entry boots the AI worker module from this directory', () => {
  const source = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
  const scripts = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  ).scripts;

  assert.match(scripts['start:dev'], /dev-supervisor\.mjs/);
  assert.match(scripts['start:dev'], /ai-worker\.module\.js/);
  assert.doesNotMatch(scripts['start:dev'], /--watch/);
  assert.doesNotMatch(scripts['start:dev'], /build --workspace backend/);

  assert.match(source, /AiWorkerModule/);
  assert.match(source, /enableShutdownHooks/);
  assert.match(source, /backend\/dist\/modules\/ai-agent\/ai-worker\.module\.js/);
  assert.doesNotMatch(source, /AppModule/);
  assert.doesNotMatch(source, /BootstrapAdminService/);
  assert.doesNotMatch(source, /migrationsRun:\s*true/);
  assert.doesNotMatch(source, /listen\(3001\)/);
});
