import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_STORE } from './ai-agent.constants.js';
import { readAiConfig, type AiRuntimeConfig } from './ai-config.js';
import { AiMetrics } from './ai-metrics.js';
import type { AiStore } from './ai-store.js';
import { AmqpBroker } from './amqp-broker.js';

@Injectable()
export class OutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisher.name);
  private readonly config: AiRuntimeConfig;
  private timer: NodeJS.Timeout | undefined;

  constructor(
    @Inject(AI_STORE) private readonly store: AiStore,
    private readonly broker: AmqpBroker,
    private readonly metrics: AiMetrics,
    config: ConfigService,
  ) {
    this.config = readAiConfig(config);
  }

  onModuleInit(): void {
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.AI_OUTBOX_ENABLED === 'false'
    ) {
      return;
    }

    this.timer = setInterval(() => {
      void this.publishPending().catch(() => {
        this.logger.warn('outbox_publish_failed');
      });
    }, this.config.outboxPollMs);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async publishPending(now = new Date()): Promise<void> {
    await this.store.transaction(async (tx) => {
      await tx.releaseStaleQueued(
        new Date(now.getTime() - this.config.leaseMs),
        now,
      );
      const events = await tx.listUnpublished(now, 20);

      for (const event of events) {
        try {
          await this.broker.publish({ eventId: event.id, runId: event.runId });
          const publishedAt = new Date();
          await tx.saveOutbox({
            ...event,
            lastError: null,
            publishedAt,
            updatedAt: publishedAt,
          });
        } catch {
          const availableAt = new Date(
            now.getTime() + this.config.retryBackoffMs[0],
          );
          await tx.saveOutbox({
            ...event,
            attemptCount: event.attemptCount + 1,
            availableAt,
            lastError: 'broker_unavailable',
            updatedAt: availableAt,
          });
          this.logger.warn(`outbox_retry ${event.id}`);
        }
      }

      const snapshot = await tx.queueSnapshot(now);
      this.metrics.recordQueue(snapshot.depth, snapshot.oldestAgeMs);
    });
  }
}
