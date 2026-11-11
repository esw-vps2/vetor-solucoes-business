import { Injectable } from '@nestjs/common';
import type { RunStatus } from './ai-agent.constants.js';

export interface AiMetricsSnapshot {
  runsByState: Record<RunStatus, number>;
  queue: { depth: number; oldestAgeMs: number };
  providerDurationMs: number[];
  timeToFirstFragmentMs: number[];
  timeToCompletionMs: number[];
  retries: number;
  deadLetters: number;
  tokens: { input: number; output: number };
  estimatedTenantUsage: Array<{
    tenantId: string;
    inputTokens: number;
    outputTokens: number;
  }>;
  process: {
    rss: number;
    heapUsed: number;
    cpuUserMicros: number;
    cpuSystemMicros: number;
  };
}

@Injectable()
export class AiMetrics {
  private readonly providerDurationMs: number[] = [];
  private readonly timeToFirstFragmentMs: number[] = [];
  private readonly timeToCompletionMs: number[] = [];
  private retries = 0;
  private deadLetters = 0;
  private inputTokens = 0;
  private outputTokens = 0;
  private queue = { depth: 0, oldestAgeMs: 0 };
  private readonly runsByState: Record<RunStatus, number> = {
    FAILED: 0,
    PROCESSING: 0,
    QUEUED: 0,
    SUCCEEDED: 0,
  };
  private readonly tenantTokens = new Map<
    string,
    { inputTokens: number; outputTokens: number }
  >();

  recordState(status: RunStatus): void {
    this.runsByState[status] += 1;
  }

  recordQueue(depth: number, oldestAgeMs: number): void {
    this.queue = { depth, oldestAgeMs };
  }

  recordRetry(): void {
    this.retries += 1;
  }

  recordDeadLetter(): void {
    this.deadLetters += 1;
  }

  recordSuccess(input: {
    tenantId: string;
    providerDurationMs: number;
    timeToFirstFragmentMs: number | null;
    timeToCompletionMs: number;
    inputTokens: number | null;
    outputTokens: number | null;
  }): void {
    this.providerDurationMs.push(input.providerDurationMs);
    this.timeToCompletionMs.push(input.timeToCompletionMs);

    if (input.timeToFirstFragmentMs !== null) {
      this.timeToFirstFragmentMs.push(input.timeToFirstFragmentMs);
    }

    const inputTokens = input.inputTokens ?? 0;
    const outputTokens = input.outputTokens ?? 0;
    this.inputTokens += inputTokens;
    this.outputTokens += outputTokens;
    const current = this.tenantTokens.get(input.tenantId) ?? {
      inputTokens: 0,
      outputTokens: 0,
    };
    current.inputTokens += inputTokens;
    current.outputTokens += outputTokens;
    this.tenantTokens.set(input.tenantId, current);
    this.recordState('SUCCEEDED');
  }

  snapshot(counts?: Record<RunStatus, number>): AiMetricsSnapshot {
    const cpu = process.cpuUsage();
    const memory = process.memoryUsage();

    return {
      deadLetters: this.deadLetters,
      estimatedTenantUsage: [...this.tenantTokens.entries()].map(
        ([tenantId, usage]) => ({ tenantId, ...usage }),
      ),
      process: {
        cpuSystemMicros: cpu.system,
        cpuUserMicros: cpu.user,
        heapUsed: memory.heapUsed,
        rss: memory.rss,
      },
      providerDurationMs: [...this.providerDurationMs],
      queue: { ...this.queue },
      retries: this.retries,
      runsByState: counts ?? { ...this.runsByState },
      timeToCompletionMs: [...this.timeToCompletionMs],
      timeToFirstFragmentMs: [...this.timeToFirstFragmentMs],
      tokens: { input: this.inputTokens, output: this.outputTokens },
    };
  }
}
