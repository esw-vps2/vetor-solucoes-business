import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import { AI_NOTIFY_CHANNEL, NOTIFY_CHAR_LIMIT } from './ai-agent.constants.js';
import type { RunStreamEvent } from './ai-agent.types.js';
import type { RunNotifier } from './run-processor.js';

@Injectable()
export class AiEventBus implements RunNotifier, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiEventBus.name);
  private readonly listeners = new Map<
    string,
    Set<(event: RunStreamEvent) => void>
  >();
  private client: Client | undefined;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const databaseUrl = this.config.get<string>('DATABASE_URL');

    if (process.env.NODE_ENV === 'test' || !databaseUrl) {
      return;
    }

    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query(`LISTEN ${AI_NOTIFY_CHANNEL}`);
    client.on('notification', (message) => {
      if (message.channel !== AI_NOTIFY_CHANNEL || !message.payload) {
        return;
      }

      const event = parseEvent(message.payload);

      if (event) {
        this.publishLocal(event);
      }
    });
    this.client = client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.end().catch(() => undefined);
    this.client = undefined;
  }

  subscribe(
    runId: string,
    listener: (event: RunStreamEvent) => void,
  ): () => void {
    const current = this.listeners.get(runId) ?? new Set();
    current.add(listener);
    this.listeners.set(runId, current);

    return () => {
      current.delete(listener);

      if (current.size === 0) {
        this.listeners.delete(runId);
      }
    };
  }

  async publish(event: RunStreamEvent): Promise<void> {
    this.publishLocal(event);
    await this.notify(event);
  }

  publishLocal(event: RunStreamEvent): void {
    for (const listener of this.listeners.get(event.runId) ?? []) {
      listener(event);
    }
  }

  private async notify(event: RunStreamEvent): Promise<void> {
    if (!this.client) {
      return;
    }

    const payload = JSON.stringify(event);

    if (payload.length > NOTIFY_CHAR_LIMIT) {
      this.logger.warn(`notify_dropped ${event.runId}`);
      return;
    }

    await this.client.query('SELECT pg_notify($1, $2)', [
      AI_NOTIFY_CHANNEL,
      payload,
    ]);
  }
}

@Injectable()
export class PgRunNotifier
  implements RunNotifier, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PgRunNotifier.name);
  private client: Client | undefined;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const databaseUrl = this.config.get<string>('DATABASE_URL');

    if (process.env.NODE_ENV === 'test' || !databaseUrl) {
      return;
    }

    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    this.client = client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.end().catch(() => undefined);
    this.client = undefined;
  }

  async publish(event: RunStreamEvent): Promise<void> {
    if (!this.client) {
      return;
    }

    const payload = JSON.stringify(event);

    if (payload.length > NOTIFY_CHAR_LIMIT) {
      this.logger.warn(`notify_dropped ${event.runId}`);
      return;
    }

    await this.client.query('SELECT pg_notify($1, $2)', [
      AI_NOTIFY_CHANNEL,
      payload,
    ]);
  }
}

function parseEvent(payload: string): RunStreamEvent | null {
  try {
    const parsed = JSON.parse(payload) as Partial<RunStreamEvent>;

    if (!parsed.runId || !parsed.type || typeof parsed.sequence !== 'number') {
      return null;
    }

    return {
      content: parsed.content,
      delta: parsed.delta,
      errorCode: parsed.errorCode,
      errorMessage: parsed.errorMessage,
      runId: parsed.runId,
      sequence: parsed.sequence,
      status: parsed.status,
      type: parsed.type,
    };
  } catch {
    return null;
  }
}
