import { createServer, type Server } from 'node:http';
import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hasProviderCredentials, readAiConfig } from './ai-config.js';
import { AmqpBroker } from './amqp-broker.js';
import { RunProcessor } from './run-processor.js';
import { sanitizeLogValue } from './ai-log.js';
import { AiMetrics } from './ai-metrics.js';

@Injectable()
export class WorkerRuntime implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerRuntime.name);
  private server: Server | undefined;
  private ready = false;
  private metricsTimer: NodeJS.Timeout | undefined;

  constructor(
    private readonly broker: AmqpBroker,
    private readonly processor: RunProcessor,
    private readonly metrics: AiMetrics,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const runtime = readAiConfig(this.config);
    this.server = createServer((request, response) => {
      if (request.method === 'GET' && request.url === '/health') {
        response.writeHead(this.ready ? 200 : 503, {
          'content-type': 'application/json',
        });
        response.end(
          JSON.stringify({ status: this.ready ? 'ok' : 'starting' }),
        );
        return;
      }

      response.writeHead(404);
      response.end();
    });
    await new Promise<void>((resolve) => {
      this.server?.listen(runtime.workerHealthPort, '0.0.0.0', () => resolve());
    });

    if (!hasProviderCredentials(runtime)) {
      this.logger.warn('worker_configuration_incomplete');
      return;
    }

    await this.broker.consume((message) =>
      this.processor.handle(message.runId),
    );
    this.ready = true;
    this.metricsTimer = setInterval(() => {
      this.logger.log(
        JSON.stringify(sanitizeLogValue(this.metrics.snapshot())),
      );
    }, 60000);
    this.metricsTimer.unref?.();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }

    this.ready = false;
    await new Promise<void>((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close(() => resolve());
    });
  }
}
