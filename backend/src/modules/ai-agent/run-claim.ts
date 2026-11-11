import type { RunRecord } from './ai-agent.types.js';
import type { ClaimResult } from './ai-agent.types.js';

export function decideClaim(
  run: RunRecord,
  now: Date,
  leaseMs: number,
): ClaimResult {
  if (run.status === 'SUCCEEDED' || run.status === 'FAILED') {
    return { kind: 'terminal', run };
  }

  const leaseActive =
    run.leaseExpiresAt !== null && run.leaseExpiresAt.getTime() > now.getTime();

  if (leaseActive) {
    return { kind: 'wait' };
  }

  if (run.status !== 'QUEUED' && run.status !== 'PROCESSING') {
    return { kind: 'wait' };
  }

  return {
    kind: 'claimed',
    run: {
      ...run,
      attempt: run.attempt + 1,
      leaseExpiresAt: new Date(now.getTime() + leaseMs),
      startedAt: run.startedAt ?? now,
      status: 'PROCESSING',
      updatedAt: now,
    },
  };
}
