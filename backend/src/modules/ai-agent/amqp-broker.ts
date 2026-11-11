import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { type ConfirmChannel, type ConsumeMessage } from 'amqplib';
import {
  AI_COMMAND_EXCHANGE,
  AI_DEAD_LETTER_EXCHANGE,
  AI_RETRY_EXCHANGE,
} from './ai-agent.constants.js';
import { readAiConfig, type AiRuntimeConfig } from './ai-config.js';
import type { DeliveryDecision, QueueReference } from './ai-agent.types.js';

@Injectable()
export class AmqpBroker implements OnModuleDestroy {
  private readonly logger = new Logger(AmqpBroker.name);
  private readonly config: AiRuntimeConfig;
  private connection: Awaited<ReturnType<typeof amqp.connect>> | undefined;
  private channel: ConfirmChannel | undefined;
  private connecting: Promise<ConfirmChannel> | null = null;
  private topologyReady = false;

  constructor(config: ConfigService) {
    this.config = readAiConfig(config);
  }

  async publish(message: QueueReference): Promise<void> {
    const channel = await this.ensureChannel();
    const body = Buffer.from(
      JSON.stringify({ eventId: message.eventId, runId: message.runId }),
    );
    await confirmPublish(
      channel,
      AI_COMMAND_EXCHANGE,
      'run',
      body,
      message.eventId,
    );
  }

  async consume(
    handler: (message: QueueReference) => Promise<DeliveryDecision>,
  ): Promise<void> {
    const channel = await this.ensureChannel();
    await channel.prefetch(this.config.maxConcurrentRuns);
    await channel.consume(
      this.config.queueName,
      (message) => {
        if (!message) {
          return;
        }

        void this.dispatch(channel, message, handler);
      },
      { noAck: false },
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.topologyReady = false;
    const channel = this.channel;
    const connection = this.connection;
    this.channel = undefined;
    this.connection = undefined;
    await channel?.close().catch(() => undefined);
    await connection?.close().catch(() => undefined);
  }

  private async ensureChannel(): Promise<ConfirmChannel> {
    if (this.channel) {
      return this.channel;
    }

    if (!this.connecting) {
      this.connecting = this.connect().finally(() => {
        this.connecting = null;
      });
    }

    return this.connecting;
  }

  private async connect(): Promise<ConfirmChannel> {
    const connection = await amqp.connect(this.config.rabbitUrl);
    connection.on('error', () => {
      this.logger.warn('broker_connection_error');
      this.channel = undefined;
      this.topologyReady = false;
    });
    connection.on('close', () => {
      this.channel = undefined;
      this.topologyReady = false;
    });
    const channel = await connection.createConfirmChannel();
    this.connection = connection;
    this.channel = channel;
    await this.assertTopology(channel);
    return channel;
  }

  private async assertTopology(channel: ConfirmChannel): Promise<void> {
    if (this.topologyReady) {
      return;
    }

    const queue = this.config.queueName;
    await channel.assertExchange(AI_COMMAND_EXCHANGE, 'direct', {
      durable: true,
    });
    await channel.assertExchange(AI_RETRY_EXCHANGE, 'direct', {
      durable: true,
    });
    await channel.assertExchange(AI_DEAD_LETTER_EXCHANGE, 'direct', {
      durable: true,
    });
    await channel.assertQueue(queue, {
      arguments: {
        'x-dead-letter-exchange': AI_RETRY_EXCHANGE,
        'x-dead-letter-routing-key': 'retry',
      },
      durable: true,
    });
    await channel.bindQueue(queue, AI_COMMAND_EXCHANGE, 'run');
    await channel.assertQueue(`${queue}.retry`, {
      arguments: {
        'x-dead-letter-exchange': AI_COMMAND_EXCHANGE,
        'x-dead-letter-routing-key': 'run',
        'x-message-ttl': this.config.retryBackoffMs[0],
      },
      durable: true,
    });
    await channel.bindQueue(`${queue}.retry`, AI_RETRY_EXCHANGE, 'retry');
    await channel.assertQueue(`${queue}.dlq`, { durable: true });
    await channel.bindQueue(`${queue}.dlq`, AI_DEAD_LETTER_EXCHANGE, 'dead');
    this.topologyReady = true;
  }

  private async dispatch(
    channel: ConfirmChannel,
    message: ConsumeMessage,
    handler: (message: QueueReference) => Promise<DeliveryDecision>,
  ): Promise<void> {
    try {
      const payload = parseReference(message.content.toString('utf8'));

      if (!payload) {
        await this.deadLetter(channel, message);
        channel.ack(message);
        return;
      }

      const decision = await handler(payload);

      if (decision === 'ack') {
        channel.ack(message);
        return;
      }

      if (decision === 'dead') {
        await this.deadLetter(channel, message, payload);
        channel.ack(message);
        return;
      }

      channel.nack(message, false, false);
    } catch {
      this.logger.warn('broker_dispatch_failed');
      channel.nack(message, false, false);
    }
  }

  private async deadLetter(
    channel: ConfirmChannel,
    message: ConsumeMessage,
    reference?: QueueReference,
  ): Promise<void> {
    const body = Buffer.from(
      JSON.stringify(
        reference ?? {
          eventId: message.properties.messageId ?? 'dead',
          runId: 'unknown',
        },
      ),
    );
    await confirmPublish(
      channel,
      AI_DEAD_LETTER_EXCHANGE,
      'dead',
      body,
      message.properties.messageId ?? 'dead',
    );
  }
}

function confirmPublish(
  channel: ConfirmChannel,
  exchange: string,
  routingKey: string,
  body: Buffer,
  messageId: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    channel.publish(
      exchange,
      routingKey,
      body,
      {
        contentType: 'application/json',
        messageId,
        persistent: true,
      },
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      },
    );
  });
}

function parseReference(value: string): QueueReference | null {
  try {
    const parsed = JSON.parse(value) as Partial<QueueReference>;

    if (!parsed.eventId || !parsed.runId) {
      return null;
    }

    return { eventId: parsed.eventId, runId: parsed.runId };
  } catch {
    return null;
  }
}
