import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { Type } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const imported = (await import('../../backend/dist/modules/ai-agent/ai-worker.module.js')) as {
    AiWorkerModule: Type<unknown>;
  };
  const app = await NestFactory.createApplicationContext(imported.AiWorkerModule);
  app.enableShutdownHooks();
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'worker_failed';
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
