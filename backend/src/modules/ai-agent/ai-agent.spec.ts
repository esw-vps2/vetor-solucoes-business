import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AddAiAgentChat1760000022000 } from '../../database/migrations/1760000022000-add-ai-agent-chat.js';
import { AI_STORE } from './ai-agent.constants.js';
import {
  assertProductionAiConfig,
  hasProviderCredentials,
  readAiConfig,
} from './ai-config.js';
import { AiConversationsService } from './ai-conversations.service.js';
import { AiAttachmentsService } from './ai-attachments.service.js';
import { AiEventBus } from './ai-event-bus.js';
import { sanitizeLogValue } from './ai-log.js';
import { AiMetrics } from './ai-metrics.js';
import { AiStreamService } from './ai-stream.service.js';
import {
  projectNotFoundReply,
  PROJECT_CARD_POLICY,
  TWO_PROJECTS,
} from './project-card-match.js';
import { ProjectCardToolsService } from './project-card-tools.service.js';
import type {
  ProviderMessage,
  ProviderResult,
  QueueReference,
} from './ai-agent.types.js';
import { ProviderError } from './ai-agent.types.js';
import { AmqpBroker } from './amqp-broker.js';
import { buildProviderMessages } from './context-builder.js';
import { MemoryAiStore } from './memory-ai-store.js';
import type { LlmProvider, ProviderStreamInput } from './openrouter.adapter.js';
import { OpenRouterAdapter } from './openrouter.adapter.js';
import { consumeSseBuffer } from './openrouter-stream.js';
import { OutboxPublisher } from './outbox-publisher.js';
import { RunProcessor, USER_SAFE_FAILURE } from './run-processor.js';
import { WorkerRuntime } from './worker-runtime.js';
import type { AuthenticatedUser } from '../portal/auth.types.js';

const tenantA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const tenantB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const userA = '11111111-1111-4111-8111-111111111111';
const userB = '22222222-2222-4222-8222-222222222222';
const admin = '33333333-3333-4333-8333-333333333333';

function configOf(values: Record<string, string> = {}): ConfigService {
  return { get: (key: string) => values[key] } as ConfigService;
}

function session(
  id: string,
  tenantId: string,
  profile = 'Usuario',
): AuthenticatedUser {
  return {
    id,
    profile,
    sessionId: '55555555-5555-4555-8555-555555555555',
    tenantId,
  };
}

class FakeProvider implements LlmProvider {
  calls: ProviderStreamInput[] = [];
  deltas: string[] = ['Olá'];
  error: ProviderError | null = null;
  errorAfterDelta = false;
  result: ProviderResult = {
    content: 'Olá',
    inputTokens: 4,
    model: 'openrouter/test-model',
    outputTokens: 2,
  };

  async stream(
    input: ProviderStreamInput,
    handlers: { onDelta: (delta: string) => Promise<void> },
  ): Promise<ProviderResult> {
    this.calls.push(input);

    if (this.error && !this.errorAfterDelta) {
      throw this.error;
    }

    for (const delta of this.deltas) {
      await handlers.onDelta(delta);
    }

    if (this.error) {
      throw this.error;
    }

    return {
      ...this.result,
      content: this.deltas.join('') || this.result.content,
    };
  }
}

class RecordingNotifier {
  events: Array<{
    type: string;
    delta?: string;
    content?: string;
    sequence: number;
  }> = [];

  async publish(event: {
    type: string;
    delta?: string;
    content?: string;
    sequence: number;
  }): Promise<void> {
    this.events.push(event);
  }
}

function seed(store: MemoryAiStore): void {
  store.tenants.push({ id: tenantA }, { id: tenantB });
  store.actors.push(
    {
      enabledActions: ['vetorAgent'],
      id: userA,
      profile: 'Usuario',
      status: 'active',
      tenantId: tenantA,
    },
    {
      enabledActions: ['vetorAgent'],
      id: userB,
      profile: 'Usuario',
      status: 'active',
      tenantId: tenantB,
    },
    {
      enabledActions: [],
      id: admin,
      profile: 'Administrador',
      status: 'active',
      tenantId: tenantA,
    },
  );
}

function fakeAttachments(
  bound: Map<
    string,
    Array<{ id: string; mimeType: string; originalName: string }>
  > = new Map(),
): AiAttachmentsService {
  return {
    bindToMessage: async () => undefined,
    deleteForConversation: async () => undefined,
    listBoundByMessage: async () => bound,
    resolveForMessage: async () => [],
  } as unknown as AiAttachmentsService;
}

function harness(
  values: Record<string, string> = {},
  bound: Map<
    string,
    Array<{ id: string; mimeType: string; originalName: string }>
  > = new Map(),
  projectCards?: ProjectCardToolsService,
) {
  const store = new MemoryAiStore();
  seed(store);
  const provider = new FakeProvider();
  const notifier = new RecordingNotifier();
  const metrics = new AiMetrics();
  const config = configOf(values);
  const attachments = fakeAttachments(bound);
  const tenants = {
    find: async () => [{ aiTokenCostPerMillion: '1.2500', id: 'shared' }],
    findOne: async () => ({ aiTokenCostPerMillion: '0.6', id: tenantA }),
  } as unknown as import('typeorm').Repository<
    import('../portal/entities/tenant.entity.js').Tenant
  >;
  const conversations = new AiConversationsService(
    store,
    tenants,
    attachments,
    config,
  );
  const processor = new RunProcessor(
    store,
    provider,
    notifier,
    metrics,
    attachments,
    config,
    projectCards,
  );
  return {
    config,
    conversations,
    metrics,
    notifier,
    processor,
    provider,
    store,
  };
}

describe('AI agent chat', () => {
  it('returns the same token price for every tenant', async () => {
    const { conversations } = harness();

    await expect(
      conversations.getPricing(session(userA, tenantA)),
    ).resolves.toEqual({
      tokenCostPerMillion: 1.25,
      usageCost: 0,
    });
    await expect(
      conversations.getPricing(session(userB, tenantB)),
    ).resolves.toEqual({
      tokenCostPerMillion: 1.25,
      usageCost: 0,
    });
  });

  it('adds the cost of each succeeded prompt for the caller only', async () => {
    const { conversations, processor } = harness();
    const owner = session(userA, tenantA);
    const other = session(userB, tenantB);
    const created = await conversations.createConversation(owner);
    const foreign = await conversations.createConversation(other);
    const first = await conversations.submitMessage(owner, created.id, 'um');

    await processor.handle(first.runId);

    await expect(conversations.getPricing(owner)).resolves.toEqual({
      tokenCostPerMillion: 1.25,
      usageCost: 0.0000075,
    });

    const second = await conversations.submitMessage(owner, created.id, 'dois');
    await processor.handle(second.runId);

    await expect(conversations.getPricing(owner)).resolves.toEqual({
      tokenCostPerMillion: 1.25,
      usageCost: 0.000015,
    });
    await expect(conversations.getPricing(other)).resolves.toMatchObject({
      usageCost: 0,
    });

    const outside = await conversations.submitMessage(
      other,
      foreign.id,
      'outro',
    );
    await processor.handle(outside.runId);

    await expect(conversations.getPricing(owner)).resolves.toMatchObject({
      usageCost: 0.000015,
    });
    await expect(conversations.getPricing(other)).resolves.toMatchObject({
      usageCost: 0.0000075,
    });
  });

  it('keeps only the system instruction and the newest turns inside the budget', () => {
    const messages = buildProviderMessages({
      history: [
        { content: 'primeira', role: 'user' },
        { content: 'segunda', role: 'assistant' },
        { content: 'terceira', role: 'user' },
      ],
      maxInputTokens: 8,
      maxMessages: 2,
      systemInstructions: 'sistema',
    });

    expect(messages[0]).toEqual({ content: 'sistema', role: 'system' });
    expect(messages.map((message) => message.content)).not.toContain(
      'primeira',
    );
    expect(messages.at(-1)?.content).toBe('terceira');
    expect(messages.map((message) => message.content)).not.toBe([
      'sistema',
      'primeira',
      'segunda',
      'terceira',
    ]);
  });

  it('denies another tenant, another owner, and a caller without vetorAgent', async () => {
    const { conversations, store } = harness();
    const owner = session(userA, tenantA);
    const created = await conversations.createConversation(owner);
    const submission = await conversations.submitMessage(
      owner,
      created.id,
      'segredo do tenant A',
    );
    const intruder = session(userB, tenantB);

    await expect(
      conversations.listMessages(intruder, created.id),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      conversations.getRun(intruder, submission.runId),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      conversations.listMessages(session(userB, tenantA), created.id),
    ).rejects.toBeInstanceOf(NotFoundException);

    const denied = harness();
    const tenantAdmin = '44444444-4444-4444-8444-444444444444';
    denied.store.actors.push({
      enabledActions: [],
      id: tenantAdmin,
      profile: 'AdministradorTenant',
      status: 'active',
      tenantId: tenantB,
    });
    await expect(
      denied.conversations.createConversation(
        session(tenantAdmin, tenantB, 'AdministradorTenant'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    store.actors.push({
      enabledActions: ['vetorAgent'],
      id: '66666666-6666-4666-8666-666666666666',
      profile: 'Usuario',
      status: 'active',
      tenantId: tenantA,
    });
    await expect(
      conversations.listMessages(
        session('66666666-6666-4666-8666-666666666666', tenantA),
        created.id,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      conversations.getRun(
        session('66666666-6666-4666-8666-666666666666', tenantA),
        submission.runId,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    const view = await conversations.getRun(owner, submission.runId);
    expect(JSON.stringify(view)).not.toContain(tenantA);
    expect(view.status).toBe('QUEUED');
  });

  it('uses the administrator session tenant and ignores a client tenant id', async () => {
    const { conversations } = harness();
    const created = await conversations.createConversation(
      session(admin, tenantB, 'Administrador'),
    );
    const listed = await conversations.listConversations(
      session(admin, tenantA, 'Administrador'),
      1,
      20,
    );

    expect(created.id).toBeTruthy();
    expect(listed.items.map((item) => item.id)).not.toContain(created.id);
    await expect(
      conversations.listMessages(
        session(admin, tenantA, 'Administrador'),
        created.id,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rolls back the message and run when the outbox insert fails', async () => {
    const { conversations, store } = harness();
    const owner = session(userA, tenantA);
    const created = await conversations.createConversation(owner);
    store.failNextOutbox = true;

    await expect(
      conversations.submitMessage(owner, created.id, 'não pode persistir'),
    ).rejects.toThrow('outbox_unavailable');
    expect(store.messages).toHaveLength(0);
    expect(store.runs).toHaveLength(0);
    expect(store.outbox).toHaveLength(0);
  });

  it('replays an idempotency key and rejects a second active run', async () => {
    const { conversations } = harness();
    const owner = session(userA, tenantA);
    const created = await conversations.createConversation(owner);
    const first = await conversations.submitMessage(
      owner,
      created.id,
      'um',
      [],
      'key-1',
    );
    const replay = await conversations.submitMessage(
      owner,
      created.id,
      'um',
      [],
      'key-1',
    );

    expect(replay).toEqual(first);
    await expect(
      conversations.submitMessage(owner, created.id, 'dois'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('sends only the authorized conversation to the provider', async () => {
    const { conversations, processor, provider, store } = harness();
    const owner = session(userA, tenantA);
    const first = await conversations.createConversation(owner);
    const second = await conversations.createConversation(owner);
    const left = await conversations.submitMessage(
      owner,
      first.id,
      'contexto alfa',
    );
    const right = await conversations.submitMessage(
      owner,
      second.id,
      'contexto beta',
    );

    expect(await processor.handle(left.runId)).toBe('ack');
    expect(await processor.handle(right.runId)).toBe('ack');
    expect(provider.calls).toHaveLength(2);
    expect(contents(provider.calls[0].messages)).toContain('contexto alfa');
    expect(contents(provider.calls[0].messages)).not.toContain('contexto beta');
    expect(contents(provider.calls[1].messages)).toContain('contexto beta');
    expect(contents(provider.calls[1].messages)).not.toContain('contexto alfa');
    expect(provider.calls[0].messages[0].role).toBe('system');
    expect(
      store.messages.filter((message) => message.role === 'assistant'),
    ).toHaveLength(2);
    expect(
      store.runs.every((run) => run.effectiveModel === 'openrouter/test-model'),
    ).toBe(true);
    expect(
      store.runs.every(
        (run) => run.inputTokens === 4 && run.outputTokens === 2,
      ),
    ).toBe(true);
    expect(
      store.runs.every((run) => run.attempt === 1 && run.durationMs !== null),
    ).toBe(true);
  });

  it('keeps same-conversation turns ordered and blocks overlap', async () => {
    const { conversations, processor, provider } = harness();
    const owner = session(userA, tenantA);
    const created = await conversations.createConversation(owner);
    const first = await conversations.submitMessage(
      owner,
      created.id,
      'turno 1',
    );
    await processor.handle(first.runId);
    const second = await conversations.submitMessage(
      owner,
      created.id,
      'turno 2',
    );
    await processor.handle(second.runId);
    const history = await conversations.listMessages(owner, created.id);

    expect(history.map((message) => message.sequence)).toEqual([1, 2, 3, 4]);
    expect(history.map((message) => message.content)).toEqual([
      'turno 1',
      'Olá',
      'turno 2',
      'Olá',
    ]);
    expect(contents(provider.calls[1].messages)).toContain('turno 1');
    expect(
      contents(provider.calls[1].messages).indexOf('turno 1'),
    ).toBeLessThan(contents(provider.calls[1].messages).indexOf('turno 2'));
  });

  it('keeps the first user message as the conversation preview', async () => {
    const { conversations, processor } = harness();
    const owner = session(userA, tenantA);
    const created = await conversations.createConversation(owner);
    const first = await conversations.submitMessage(
      owner,
      created.id,
      'primeira pergunta',
    );
    await processor.handle(first.runId);
    const second = await conversations.submitMessage(
      owner,
      created.id,
      'que arquivo e esse?',
    );
    await processor.handle(second.runId);
    const list = await conversations.listConversations(owner, 1, 20);

    expect(list.items[0]?.preview).toBe('primeira pergunta');
  });

  it('includes bound attachments on the user message', async () => {
    const bound = new Map<
      string,
      Array<{ id: string; mimeType: string; originalName: string }>
    >();
    const { conversations } = harness({}, bound);
    const owner = session(userA, tenantA);
    const created = await conversations.createConversation(owner);
    const submission = await conversations.submitMessage(
      owner,
      created.id,
      'veja a imagem',
    );
    bound.set(submission.messageId, [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab',
        mimeType: 'image/png',
        originalName: 'foto.png',
      },
    ]);
    const history = await conversations.listMessages(owner, created.id);

    expect(history[0]?.attachments).toEqual([
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab',
        mimeType: 'image/png',
        originalName: 'foto.png',
      },
    ]);
    expect(history[0]?.content).toBe('veja a imagem');
  });

  it('renames and deletes an owned conversation', async () => {
    const { conversations, processor, store } = harness();
    const owner = session(userA, tenantA);
    const created = await conversations.createConversation(owner);
    const submission = await conversations.submitMessage(
      owner,
      created.id,
      'primeira pergunta',
    );
    await processor.handle(submission.runId);

    const renamed = await conversations.renameConversation(
      owner,
      created.id,
      'Relatório mensal',
    );
    expect(renamed.title).toBe('Relatório mensal');
    expect(renamed.preview).toBe('primeira pergunta');

    await conversations.deleteConversation(owner, created.id);
    expect(store.conversations).toHaveLength(0);
    expect(store.messages).toHaveLength(0);
  });

  it('does not call the provider when the queue relationship does not match', async () => {
    const { conversations, processor, provider, store } = harness();
    const owner = session(userA, tenantA);
    const created = await conversations.createConversation(owner);
    const submission = await conversations.submitMessage(
      owner,
      created.id,
      'privado',
    );
    const run = store.runs[0];
    run.tenantId = tenantB;
    const listed = vi.spyOn(store, 'listMessages');

    expect(await processor.handle(submission.runId)).toBe('ack');
    expect(listed).not.toHaveBeenCalled();
    expect(provider.calls).toHaveLength(0);
    expect(store.runs[0].status).toBe('FAILED');
    expect(store.runs[0].errorCode).toBe('authorization_mismatch');
    expect(store.runs[0].errorMessage).toBe(USER_SAFE_FAILURE);
  });

  it('rejects each broken run relationship before calling the provider', async () => {
    const owner = session(userA, tenantA);
    const cases: Array<(env: ReturnType<typeof harness>) => void> = [
      (env) => {
        env.store.conversations[0].ownerUserId = userB;
      },
      (env) => {
        env.store.actors[0].status = 'inactive';
      },
      (env) => {
        env.store.actors[0].enabledActions = [];
      },
      (env) => {
        env.store.messages[0].role = 'assistant';
        env.store.messages[0].authorUserId = null;
      },
      (env) => {
        env.store.messages[0].conversationId =
          '77777777-7777-4777-8777-777777777777';
      },
      (env) => {
        env.store.conversations.splice(0, 1);
      },
    ];

    for (const mutate of cases) {
      const env = harness();
      const created = await env.conversations.createConversation(owner);
      const submission = await env.conversations.submitMessage(
        owner,
        created.id,
        'privado',
      );
      const listed = vi.spyOn(env.store, 'listMessages');
      mutate(env);
      expect(await env.processor.handle(submission.runId)).toBe('ack');
      expect(listed).not.toHaveBeenCalled();
      expect(env.provider.calls).toHaveLength(0);
      expect(env.store.runs[0]?.status ?? 'FAILED').toBe('FAILED');
    }
  });

  it('acks a duplicate delivery without a second provider call', async () => {
    const { conversations, processor, provider, store } = harness();
    const owner = session(userA, tenantA);
    const created = await conversations.createConversation(owner);
    const submission = await conversations.submitMessage(
      owner,
      created.id,
      'uma vez',
    );

    expect(await processor.handle(submission.runId)).toBe('ack');
    expect(await processor.handle(submission.runId)).toBe('ack');
    expect(provider.calls).toHaveLength(1);
    expect(
      store.messages.filter((message) => message.role === 'assistant'),
    ).toHaveLength(1);
  });

  it('retries before any fragment and stops retrying after content started', async () => {
    const before = harness({ RABBITMQ_RETRY_LIMIT: '3' });
    const owner = session(userA, tenantA);
    const created = await before.conversations.createConversation(owner);
    const submission = await before.conversations.submitMessage(
      owner,
      created.id,
      'tente',
    );
    before.provider.error = new ProviderError('provider_unavailable', true);
    before.provider.deltas = [];

    expect(await before.processor.handle(submission.runId)).toBe('retry');
    expect(before.provider.calls).toHaveLength(1);
    expect(before.store.runs[0].status).toBe('QUEUED');
    before.store.runs[0].leaseExpiresAt = new Date(Date.now() - 1000);
    before.provider.error = null;
    before.provider.deltas = ['pronto'];
    expect(await before.processor.handle(submission.runId)).toBe('ack');
    expect(before.provider.calls).toHaveLength(2);

    const after = harness({ RABBITMQ_RETRY_LIMIT: '3' });
    const conversation = await after.conversations.createConversation(owner);
    const run = await after.conversations.submitMessage(
      owner,
      conversation.id,
      'parcial',
    );
    after.provider.error = new ProviderError('provider_unavailable', true);
    after.provider.errorAfterDelta = true;
    after.provider.deltas = ['pedaço'];

    expect(await after.processor.handle(run.runId)).toBe('ack');
    expect(after.provider.calls).toHaveLength(1);
    expect(after.store.runs[0].status).toBe('FAILED');
    expect(after.store.runs[0].errorMessage).toBe(USER_SAFE_FAILURE);
    expect(await after.processor.handle(run.runId)).toBe('ack');
    expect(after.provider.calls).toHaveLength(1);
  });

  it('delays a run when the tenant concurrency limit is full', async () => {
    const { conversations, processor, provider } = harness({
      AI_MAX_CONCURRENT_RUNS: '2',
      AI_MAX_CONCURRENT_RUNS_PER_TENANT: '1',
    });
    const owner = session(userA, tenantA);
    const first = await conversations.createConversation(owner);
    const second = await conversations.createConversation(owner);
    const left = await conversations.submitMessage(owner, first.id, 'ocupado');
    const right = await conversations.submitMessage(owner, second.id, 'espera');
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    provider.stream = async (input, handlers) => {
      provider.calls.push(input);
      await gate;
      await handlers.onDelta('ok');
      return { ...provider.result, content: 'ok' };
    };

    const pending = processor.handle(left.runId);
    await vi.waitFor(() => expect(provider.calls).toHaveLength(1));
    expect(await processor.handle(right.runId)).toBe('delay');
    release?.();
    expect(await pending).toBe('ack');
    expect(provider.calls).toHaveLength(1);
  });

  it('publishes only unpublished outbox rows and keeps them after a broker failure', async () => {
    const { conversations, metrics, store } = harness();
    const owner = session(userA, tenantA);
    const created = await conversations.createConversation(owner);
    await conversations.submitMessage(owner, created.id, 'fila');
    const broker = {
      publish: vi
        .fn()
        .mockRejectedValueOnce(new Error('down'))
        .mockResolvedValue(undefined),
    };
    const publisher = new OutboxPublisher(
      store,
      broker as unknown as AmqpBroker,
      metrics,
      configOf(),
    );

    await publisher.publishPending();
    expect(store.outbox[0].publishedAt).toBeNull();
    expect(store.outbox[0].lastError).toBe('broker_unavailable');
    await publisher.publishPending(new Date(Date.now() + 5000));
    expect(store.outbox[0].publishedAt).toBeInstanceOf(Date);
    expect(broker.publish).toHaveBeenCalledWith({
      eventId: store.outbox[0].id,
      runId: store.outbox[0].runId,
    });
  });

  it('republishes a queued run whose broker message was already marked sent', async () => {
    const { conversations, metrics, store } = harness();
    const owner = session(userA, tenantA);
    const created = await conversations.createConversation(owner);
    await conversations.submitMessage(owner, created.id, 'fila');
    const publishedAt = new Date(Date.now() - 130000);
    store.outbox[0].publishedAt = publishedAt;
    store.runs[0].createdAt = publishedAt;
    const broker = { publish: vi.fn().mockResolvedValue(undefined) };
    const publisher = new OutboxPublisher(
      store,
      broker as unknown as AmqpBroker,
      metrics,
      configOf(),
    );

    await publisher.publishPending();

    expect(broker.publish).toHaveBeenCalledWith({
      eventId: store.outbox[0].id,
      runId: store.outbox[0].runId,
    });
    expect(store.outbox[0].publishedAt).toBeInstanceOf(Date);
    expect(store.outbox[0].publishedAt?.getTime()).toBeGreaterThan(
      publishedAt.getTime(),
    );
  });

  it('acks only after the handler returns and dead-letters exhausted messages', async () => {
    const broker = new AmqpBroker(configOf());
    const acks: string[] = [];
    const published: Array<{
      exchange: string;
      persistent: boolean;
      body: string;
    }> = [];
    const channel = {
      ack: () => acks.push('ack'),
      nack: () => acks.push('nack'),
      publish: (
        exchange: string,
        _routingKey: string,
        body: Buffer,
        options: { persistent?: boolean },
        callback: (error: Error | null) => void,
      ) => {
        published.push({
          body: body.toString('utf8'),
          exchange,
          persistent: options.persistent === true,
        });
        callback(null);
        return true;
      },
    };
    const message = {
      content: Buffer.from(
        JSON.stringify({
          eventId: 'event-1',
          runId: 'run-1',
          content: 'secret',
        }),
      ),
      properties: { messageId: 'event-1' },
    };
    const dispatch = (
      broker as unknown as {
        dispatch: (
          channel: unknown,
          message: unknown,
          handler: (reference: QueueReference) => Promise<string>,
        ) => Promise<void>;
      }
    ).dispatch.bind(broker);

    await dispatch(channel, message, async (reference) => {
      expect(reference).toEqual({ eventId: 'event-1', runId: 'run-1' });
      expect(acks).toHaveLength(0);
      return 'ack';
    });
    expect(acks).toEqual(['ack']);

    acks.length = 0;
    await dispatch(channel, message, async () => 'dead');
    expect(
      published.some((item) => item.exchange === 'ai.dlx' && item.persistent),
    ).toBe(true);
    expect(acks).toEqual(['ack']);
    expect(published.some((item) => item.body.includes('secret'))).toBe(false);
  });

  it('parses provider frames without retrying a rejected request', async () => {
    const frames = consumeSseBuffer(
      'data: {"choices":[{"delta":{"content":"Oi"}}],"usage":{"prompt_tokens":3,"completion_tokens":1},"model":"m"}\n\ndata: [DONE]\n\n',
    );
    expect(frames.frames[0]).toMatchObject({
      delta: 'Oi',
      inputTokens: 3,
      outputTokens: 1,
    });
    expect(frames.frames.some((frame) => frame.done)).toBe(true);

    const adapter = new OpenRouterAdapter();
    const fetchMock = vi.fn().mockResolvedValue({
      body: null,
      ok: false,
      status: 400,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      adapter.stream(
        {
          apiKey: 'test-key',
          baseUrl: 'https://openrouter.ai/api/v1',
          idleTimeoutMs: 1000,
          maxOutputTokens: 20,
          maxResponseBytes: 1_000_000,
          messages: [{ content: 'oi', role: 'user' }],
          model: 'openrouter/test-model',
          timeoutMs: 1000,
        },
        { onDelta: async () => undefined },
      ),
    ).rejects.toMatchObject({ code: 'provider_rejected', retryable: false });
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({ stream: true });
    expect(request.redirect).toBe('manual');
    expect(request.headers).not.toHaveProperty('X-OpenRouter-Data-Policy');

    fetchMock.mockResolvedValueOnce({
      body: null,
      ok: false,
      status: 429,
    });
    await expect(
      adapter.stream(
        {
          apiKey: 'test-key',
          baseUrl: 'https://openrouter.ai/api/v1',
          idleTimeoutMs: 1000,
          maxOutputTokens: 20,
          maxResponseBytes: 1_000_000,
          messages: [{ content: 'oi', role: 'user' }],
          model: 'openrouter/test-model',
          timeoutMs: 1000,
        },
        { onDelta: async () => undefined },
      ),
    ).rejects.toMatchObject({ code: 'provider_rate_limit', retryable: true });

    const payload =
      'data: {"choices":[{"delta":{"content":"Oi"}}],"model":"openrouter/served"}\n\ndata: [DONE]\n\n';
    fetchMock.mockResolvedValueOnce({
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(payload));
          controller.close();
        },
      }),
      ok: true,
      status: 200,
    });
    const deltas: string[] = [];
    const streamed = await adapter.stream(
      {
        apiKey: 'test-key',
        baseUrl: 'https://openrouter.ai/api/v1',
        idleTimeoutMs: 1000,
        maxOutputTokens: 20,
        maxResponseBytes: 1_000_000,
        messages: [{ content: 'oi', role: 'user' }],
        model: 'openrouter/test-model',
        timeoutMs: 1000,
      },
      {
        onDelta: async (delta) => {
          deltas.push(delta);
        },
      },
    );
    expect(deltas).toEqual(['Oi']);
    expect(streamed).toMatchObject({
      content: 'Oi',
      model: 'openrouter/served',
    });

    fetchMock.mockResolvedValueOnce({
      body: null,
      ok: false,
      status: 302,
    });
    await expect(
      adapter.stream(
        {
          apiKey: 'test-key',
          baseUrl: 'https://openrouter.ai/api/v1',
          idleTimeoutMs: 1000,
          maxOutputTokens: 20,
          maxResponseBytes: 1_000_000,
          messages: [{ content: 'oi', role: 'user' }],
          model: 'openrouter/test-model',
          timeoutMs: 1000,
        },
        { onDelta: async () => undefined },
      ),
    ).rejects.toMatchObject({ code: 'provider_rejected', retryable: false });

    fetchMock.mockResolvedValueOnce({
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('x'.repeat(32)));
          controller.close();
        },
      }),
      ok: true,
      status: 200,
    });
    await expect(
      adapter.stream(
        {
          apiKey: 'test-key',
          baseUrl: 'https://openrouter.ai/api/v1',
          idleTimeoutMs: 1000,
          maxOutputTokens: 20,
          maxResponseBytes: 8,
          messages: [{ content: 'oi', role: 'user' }],
          model: 'openrouter/test-model',
          timeoutMs: 1000,
        },
        { onDelta: async () => undefined },
      ),
    ).rejects.toMatchObject({ code: 'provider_rejected', retryable: false });
    vi.unstubAllGlobals();
  });

  it('streams an owned terminal run and rejects an unknown run before writing', async () => {
    const { conversations, store } = harness({ AI_MAX_SSE_CONNECTIONS: '1' });
    const owner = session(userA, tenantA);
    const created = await conversations.createConversation(owner);
    const submission = await conversations.submitMessage(
      owner,
      created.id,
      'final',
    );
    store.runs[0].status = 'SUCCEEDED';
    store.runs[0].assistantMessageId = 'assistant-1';
    store.messages.push({
      authorUserId: null,
      content: 'resposta final',
      conversationId: created.id,
      createdAt: new Date(),
      id: 'assistant-1',
      role: 'assistant',
      runId: submission.runId,
      sequence: 2,
      tenantId: tenantA,
      updatedAt: new Date(),
    });
    const bus = new AiEventBus(configOf());
    const streams = new AiStreamService(
      conversations,
      bus,
      configOf({ AI_MAX_SSE_CONNECTIONS: '1' }),
    );
    const response = fakeResponse();

    await streams.stream(
      owner,
      submission.runId,
      response as unknown as Response,
      '99',
    );
    const body = response.chunks.join('');
    expect(response.headers['Content-Type']).toContain('text/event-stream');
    expect(response.headers['Cache-Control']).toContain('no-cache');
    expect(response.headers['X-Accel-Buffering']).toBe('no');
    expect(body).toContain('event: run.completed');
    expect(body).toContain('resposta final');
    expect(body).not.toContain(tenantA);
    expect(body.match(/event: run\.completed/g)).toHaveLength(1);

    const denied = fakeResponse();
    await expect(
      streams.stream(
        session(userB, tenantB),
        submission.runId,
        denied as unknown as Response,
        undefined,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(denied.chunks).toHaveLength(0);

    store.runs[0].status = 'QUEUED';
    const active = new AiStreamService(
      conversations,
      bus,
      configOf({
        AI_MAX_SSE_CONNECTIONS: '10',
        AI_MAX_SSE_CONNECTIONS_PER_OWNER: '1',
      }),
    );
    const held = fakeResponse();
    await active.stream(
      owner,
      submission.runId,
      held as unknown as Response,
      undefined,
    );
    const other = await conversations.createConversation(
      session(userB, tenantB),
    );
    const otherRun = await conversations.submitMessage(
      session(userB, tenantB),
      other.id,
      'outro',
    );
    await active.stream(
      session(userB, tenantB),
      otherRun.runId,
      fakeResponse() as unknown as Response,
      undefined,
    );
    const limited = await active
      .stream(
        owner,
        submission.runId,
        fakeResponse() as unknown as Response,
        undefined,
      )
      .then(
        () => null,
        (error: unknown) => error,
      );
    expect(limited).toBeInstanceOf(HttpException);
    expect((limited as HttpException).getStatus()).toBe(429);
  });

  it('fails closed in production and redacts provider content from logs', () => {
    expect(() =>
      assertProductionAiConfig({
        AI_AGENT_SYSTEM_INSTRUCTIONS: 'Answer from the conversation.',
        OPENROUTER_API_KEY: 'replace-with-openrouter-key',
        OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
        OPENROUTER_MODEL: 'openrouter/example-model',
        RABBITMQ_URL: 'amqp://vetor:change-me@rabbitmq:5672',
      }),
    ).toThrow('Invalid production AI provider configuration.');
    expect(
      hasProviderCredentials(
        readAiConfig(
          configOf({ OPENROUTER_API_KEY: 'replace-with-openrouter-key' }),
        ),
      ),
    ).toBe(false);

    const sanitized = sanitizeLogValue({
      apiKey: 'secret-value',
      content: 'prompt secreto',
      delta: 'fragmento',
      runId: 'run-1',
    });
    expect(JSON.stringify(sanitized)).not.toContain('secret-value');
    expect(JSON.stringify(sanitized)).not.toContain('prompt secreto');
    expect(JSON.stringify(sanitized)).toContain('run-1');
    const snapshot = new AiMetrics().snapshot();
    expect(JSON.stringify(snapshot)).not.toMatch(/price|usd/i);
  });

  it('keeps the worker, database, and broker boundaries', async () => {
    const root = resolve(import.meta.dirname, '../../../../');
    const migration = readFileSync(
      resolve(
        root,
        'backend/src/database/migrations/1760000022000-add-ai-agent-chat.ts',
      ),
      'utf8',
    );
    const compose = readFileSync(
      resolve(root, 'infrastructure/docker-compose.yml'),
      'utf8',
    );
    const worker = readFileSync(
      resolve(root, 'worker-proxy-agent-ia/src/main.ts'),
      'utf8',
    );
    const client = readFileSync(
      resolve(root, 'frontend/lib/api/ai-agent.ts'),
      'utf8',
    );
    const example = readFileSync(
      resolve(root, 'infrastructure/.env.backend.example'),
      'utf8',
    );
    const domain = readFileSync(
      resolve(root, 'backend/src/modules/ai-agent/amqp-broker.ts'),
      'utf8',
    );

    expect(migration).toContain('ON DELETE CASCADE');
    expect(migration).toContain('DEFERRABLE INITIALLY DEFERRED');
    expect(migration).toContain('uq_ai_runs_one_active');
    expect(migration).not.toContain('ENABLE ROW LEVEL SECURITY');
    const queries: string[] = [];
    await new AddAiAgentChat1760000022000().up({
      query: async (sql: string) => {
        queries.push(sql);
      },
    } as never);
    expect(queries.join('\n')).toContain('UNIQUE ("tenant_id", "id")');
    expect(queries.join('\n')).not.toContain('ENABLE ROW LEVEL SECURITY');

    expect(compose).toContain('rabbitmq:3.13-alpine');
    expect(compose).toContain('vetor_ai_worker');
    expect(compose).not.toMatch(/\$\{POSTGRES_PORT/);
    expect(compose).toContain('redis:7.2-alpine');
    expect(compose).not.toMatch(/15672:15672|5672:5672/);
    expect(worker).toContain('AiWorkerModule');
    expect(worker).not.toContain('AppModule');
    expect(client).toContain('withCredentials: true');
    expect(client).not.toMatch(
      /localStorage|sessionStorage|OPENROUTER_API_KEY/,
    );
    expect(example).toContain('replace-with-openrouter-key');
    expect(example).not.toMatch(/sk-or-/);
    expect(domain).not.toMatch(/bullmq|ioredis|WebSocketGateway/);
    expect(AI_STORE).toBeTypeOf('symbol');
  });

  it('does not consume while provider credentials are missing', async () => {
    const broker = { consume: vi.fn() };
    const runtime = new WorkerRuntime(
      broker as unknown as AmqpBroker,
      {} as RunProcessor,
      new AiMetrics(),
      configOf({ AI_WORKER_HEALTH_PORT: '32191' }),
    );

    await runtime.onModuleInit();
    const response = await fetch('http://127.0.0.1:32191/health');
    expect(response.status).toBe(503);
    expect(broker.consume).not.toHaveBeenCalled();
    await runtime.onModuleDestroy();
  });
});

function contents(messages: ProviderMessage[]): string {
  return messages.map((message) => message.content).join('\n');
}

describe('project card turns', () => {
  it('keeps the project policy after the configured instructions', async () => {
    const { conversations, processor, provider } = harness();
    const owner = session(userA, tenantA);
    const created = await conversations.createConversation(owner);
    const submitted = await conversations.submitMessage(
      owner,
      created.id,
      'olá',
    );

    expect(await processor.handle(submitted.runId)).toBe('ack');
    expect(provider.calls[0].messages[0]).toMatchObject({
      content: expect.stringContaining(PROJECT_CARD_POLICY),
      role: 'system',
    });
  });

  it('does not stream a successful mutation when the project is missing or ambiguous', async () => {
    const cards = {
      async handleTurn(input: { message: string }) {
        if (input.message.includes('Ambíguo')) {
          return { reply: TWO_PROJECTS, trace: [] };
        }

        return { reply: projectNotFoundReply('Ausente'), trace: [] };
      },
    } as unknown as ProjectCardToolsService;
    const { conversations, processor, provider, store } = harness(
      {},
      new Map(),
      cards,
    );
    const owner = session(userA, tenantA);
    const created = await conversations.createConversation(owner);
    const missing = await conversations.submitMessage(
      owner,
      created.id,
      'liste o projeto Ausente',
    );

    expect(await processor.handle(missing.runId)).toBe('ack');
    const ambiguous = await conversations.submitMessage(
      owner,
      created.id,
      'liste o projeto Ambíguo',
    );

    expect(await processor.handle(ambiguous.runId)).toBe('ack');
    expect(provider.calls).toHaveLength(0);
    const replies = store.messages
      .filter((message) => message.role === 'assistant')
      .map((message) => message.content);

    expect(replies).toContain(projectNotFoundReply('Ausente'));
    expect(replies).toContain(TWO_PROJECTS);
    expect(replies.join('\n')).not.toContain('Operação realizada com sucesso.');
  });
});

function fakeResponse() {
  const chunks: string[] = [];
  const headers: Record<string, string> = {};
  const listeners = new Map<string, Array<() => void>>();

  return {
    chunks,
    headers,
    end() {
      listeners.get('close')?.forEach((listener) => listener());
    },
    flushHeaders() {
      return undefined;
    },
    on(event: string, listener: () => void) {
      const current = listeners.get(event) ?? [];
      current.push(listener);
      listeners.set(event, current);
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    status() {
      return this;
    },
    write(chunk: string) {
      chunks.push(chunk);
      return true;
    },
  };
}
