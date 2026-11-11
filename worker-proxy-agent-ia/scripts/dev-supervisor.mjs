import { spawn } from 'node:child_process';
import { statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const DEFAULT_POLL_MS = 500;
const STOP_GRACE_MS = 2000;

export async function supervise({
  modulePath,
  command,
  args,
  pollMs = DEFAULT_POLL_MS,
  signal,
  stdio = 'inherit',
}) {
  let child;
  const stopChild = () => {
    terminate(child);
  };

  signal?.addEventListener('abort', stopChild);

  try {
    while (!signal?.aborted) {
      const startedAt = moduleStamp(modulePath);

      if (startedAt === 0) {
        await delay(pollMs, signal);
        continue;
      }

      child = spawn(command, args, { stdio });
      const current = child;
      let stamp = startedAt;

      await new Promise((resolve) => {
        const timer = setInterval(() => {
          if (signal?.aborted) {
            terminate(current);
            return;
          }

          const next = moduleStamp(modulePath);

          if (next !== stamp) {
            stamp = next;
            terminate(current);
          }
        }, pollMs);

        const finish = () => {
          clearInterval(timer);
          resolve();
        };

        current.once('exit', finish);
        current.once('error', finish);
      });
      child = undefined;

      if (!signal?.aborted && moduleStamp(modulePath) !== 0) {
        await delay(pollMs, signal);
      }
    }
  } finally {
    signal?.removeEventListener('abort', stopChild);
    terminate(child);
  }
}

function moduleStamp(modulePath) {
  try {
    const stat = statSync(modulePath);

    if (!stat.isFile() || stat.size === 0) {
      return 0;
    }

    return stat.mtimeMs;
  } catch {
    return 0;
  }
}

function terminate(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  child.kill('SIGTERM');
  const timer = setTimeout(() => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
    }
  }, STOP_GRACE_MS);
  timer.unref?.();
  child.once('exit', () => clearTimeout(timer));
}

function delay(ms, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }

    const timer = setTimeout(resolve, ms);
    const abort = () => {
      clearTimeout(timer);
      resolve();
    };

    signal?.addEventListener('abort', abort, { once: true });
  });
}

const entry = process.argv[1];

if (entry && import.meta.url === pathToFileURL(entry).href) {
  const modulePath = process.argv[2];
  const separator = process.argv.indexOf('--');
  const command = process.argv[separator + 1];
  const args = process.argv.slice(separator + 2);

  if (!modulePath || separator < 3 || !command) {
    process.stderr.write('usage: dev-supervisor.mjs <module> -- <command> [args]\n');
    process.exit(1);
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  process.once('SIGTERM', abort);
  process.once('SIGINT', abort);
  await supervise({
    args,
    command,
    modulePath,
    signal: controller.signal,
  });
}
