import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { supervise } from '../scripts/dev-supervisor.mjs';

test('restarts the worker when the backend module appears or is replaced', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ai-worker-supervisor-'));
  const modulePath = join(directory, 'ai-worker.module.js');
  const marker = join(directory, 'starts.txt');
  const child = join(directory, 'child.mjs');
  await writeFile(
    child,
    `import { appendFileSync } from 'node:fs';
appendFileSync(process.argv[2], 'start\\n');
setInterval(() => {}, 1000);
`,
  );
  const controller = new AbortController();

  const done = supervise({
    args: [child, marker],
    command: process.execPath,
    modulePath,
    pollMs: 30,
    signal: controller.signal,
    stdio: 'ignore',
  });

  try {
    await delay(80);
    await assert.rejects(readFile(marker, 'utf8'));

    await writeFile(modulePath, 'export {}\n');
    await waitFor(async () => {
      assert.equal(await readFile(marker, 'utf8'), 'start\n');
    });

    const future = new Date(Date.now() + 10_000);
    await writeFile(modulePath, 'export const rebuilt = true;\n');
    await utimes(modulePath, future, future);
    await waitFor(async () => {
      assert.equal(await readFile(marker, 'utf8'), 'start\nstart\n');
    });
  } finally {
    controller.abort();
    await done;
    await rm(directory, { recursive: true, force: true });
  }
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(assertion) {
  const started = Date.now();
  let lastError;

  while (Date.now() - started < 2000) {
    try {
      await assertion();
      return;
    } catch (error) {
      lastError = error;
      await delay(40);
    }
  }

  throw lastError;
}
