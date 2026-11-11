import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { AuthenticatedUser } from '../portal/auth.types.js';
import { readAiConfig, type AiRuntimeConfig } from './ai-config.js';
import { AiConversationsService } from './ai-conversations.service.js';
import { AiEventBus } from './ai-event-bus.js';
import type { RunRecord, RunStreamEvent } from './ai-agent.types.js';

@Injectable()
export class AiStreamService {
  private readonly config: AiRuntimeConfig;
  private connections = 0;
  private readonly connectionsByOwner = new Map<string, number>();

  constructor(
    private readonly conversations: AiConversationsService,
    private readonly bus: AiEventBus,
    config: ConfigService,
  ) {
    this.config = readAiConfig(config);
  }

  async stream(
    session: AuthenticatedUser,
    runId: string,
    response: Response,
    lastEventId: string | undefined,
  ): Promise<void> {
    const { run } = await this.conversations.ownedRun(session, runId);

    const ownerConnections = this.connectionsByOwner.get(session.id) ?? 0;

    if (
      this.connections >= this.config.maxSseConnections ||
      ownerConnections >= this.config.maxSseConnectionsPerOwner
    ) {
      throw new HttpException(
        'Too many requests.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.connections += 1;
    this.connectionsByOwner.set(session.id, ownerConnections + 1);
    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders();

    let closed = false;
    let sequence = 0;
    const write = (event: RunStreamEvent) => {
      if (closed) {
        return;
      }

      sequence += 1;
      const payload = {
        ...event,
        sequence: event.sequence > 0 ? event.sequence : sequence,
      };
      response.write(`id: ${payload.sequence}\n`);
      response.write(`event: ${event.type}\n`);
      response.write(`data: ${JSON.stringify(publicEvent(payload))}\n\n`);
    };
    const finish = () => {
      if (closed) {
        return;
      }

      closed = true;
      clearInterval(heartbeat);
      unsubscribe();
      this.release(session.id);
      response.end();
    };
    const unsubscribe = this.bus.subscribe(run.id, (event) => {
      write(event);

      if (event.type === 'run.completed' || event.type === 'run.failed') {
        finish();
      }
    });
    const heartbeat = setInterval(() => {
      write({
        runId: run.id,
        sequence: sequence + 1,
        type: 'run.heartbeat',
      });
    }, this.config.heartbeatMs);
    heartbeat.unref?.();

    response.on('close', finish);
    void lastEventId;

    const view = await this.conversations.toRunView(run);
    write(
      run.status === 'SUCCEEDED'
        ? {
            content: view.assistantContent ?? '',
            runId: run.id,
            sequence: 1,
            status: 'SUCCEEDED',
            type: 'run.completed',
          }
        : run.status === 'FAILED'
          ? {
              errorCode: view.errorCode ?? 'failed',
              errorMessage: view.errorMessage ?? '',
              runId: run.id,
              sequence: 1,
              status: 'FAILED',
              type: 'run.failed',
            }
          : currentEvent(run),
    );

    if (run.status === 'SUCCEEDED' || run.status === 'FAILED') {
      finish();
    }
  }

  private release(ownerId: string): void {
    this.connections = Math.max(0, this.connections - 1);
    const next = (this.connectionsByOwner.get(ownerId) ?? 1) - 1;

    if (next <= 0) {
      this.connectionsByOwner.delete(ownerId);
      return;
    }

    this.connectionsByOwner.set(ownerId, next);
  }
}

function currentEvent(run: RunRecord): RunStreamEvent {
  return {
    runId: run.id,
    sequence: 1,
    status: run.status,
    type: run.status === 'PROCESSING' ? 'run.processing' : 'run.queued',
  };
}

function publicEvent(event: RunStreamEvent): RunStreamEvent {
  return {
    content: event.content,
    delta: event.delta,
    errorCode: event.errorCode,
    errorMessage: event.errorMessage,
    runId: event.runId,
    sequence: event.sequence,
    status: event.status,
    type: event.type,
  };
}
