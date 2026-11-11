import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { hasMappedAction } from '../portal/enabled-actions.js';
import { AI_STORE, DELTA_CHAR_LIMIT } from './ai-agent.constants.js';
import { readAiConfig, type AiRuntimeConfig } from './ai-config.js';
import type { AiStore } from './ai-store.js';
import type {
  DeliveryDecision,
  MessageRecord,
  ProviderMessage,
  RunRecord,
  RunStreamEvent,
  StoredActor,
} from './ai-agent.types.js';
import { ProviderError } from './ai-agent.types.js';
import { AiMetrics } from './ai-metrics.js';
import {
  buildProviderMessages,
  estimateMessageTokens,
} from './context-builder.js';
import {
  buildUserProviderContent,
  selectProviderModel,
} from './ai-provider-content.js';
import { AiAttachmentsService } from './ai-attachments.service.js';
import type { LlmProvider } from './openrouter.adapter.js';
import { OpenRouterAdapter } from './openrouter.adapter.js';
import { decideClaim } from './run-claim.js';
import { PROJECT_CARD_POLICY } from './project-card-match.js';
import { ProjectCardToolsService } from './project-card-tools.service.js';

export const USER_SAFE_FAILURE = 'Não foi possível concluir a operação.';

export const RUN_NOTIFIER = Symbol('RUN_NOTIFIER');

export interface RunNotifier {
  publish(event: RunStreamEvent): Promise<void>;
}

export class RunGate {
  private active = 0;
  private readonly byTenant = new Map<string, number>();

  constructor(
    private readonly globalLimit: number,
    private readonly tenantLimit: number,
  ) {}

  tryEnter(tenantId: string): boolean {
    const tenantActive = this.byTenant.get(tenantId) ?? 0;

    if (this.active >= this.globalLimit || tenantActive >= this.tenantLimit) {
      return false;
    }

    this.active += 1;
    this.byTenant.set(tenantId, tenantActive + 1);
    return true;
  }

  leave(tenantId: string): void {
    this.active = Math.max(0, this.active - 1);
    const next = (this.byTenant.get(tenantId) ?? 1) - 1;

    if (next <= 0) {
      this.byTenant.delete(tenantId);
      return;
    }

    this.byTenant.set(tenantId, next);
  }
}

@Injectable()
export class RunProcessor {
  private readonly logger = new Logger(RunProcessor.name);
  private readonly config: AiRuntimeConfig;
  private readonly sequences = new Map<string, number>();
  readonly gate: RunGate;

  constructor(
    @Inject(AI_STORE) private readonly store: AiStore,
    @Inject(OpenRouterAdapter) private readonly provider: LlmProvider,
    @Inject(RUN_NOTIFIER) private readonly notifier: RunNotifier,
    private readonly metrics: AiMetrics,
    private readonly attachments: AiAttachmentsService,
    config: ConfigService,
    @Optional()
    @Inject(ProjectCardToolsService)
    private readonly projectCards?: ProjectCardToolsService,
  ) {
    this.config = readAiConfig(config);
    this.gate = new RunGate(
      this.config.maxConcurrentRuns,
      this.config.maxConcurrentRunsPerTenant,
    );
  }

  async handle(runId: string, now = new Date()): Promise<DeliveryDecision> {
    const run = await this.store.findRunById(runId);

    if (!run) {
      this.metrics.recordDeadLetter();
      this.logger.warn(`run_missing ${runId}`);
      return 'dead';
    }

    if (run.status === 'SUCCEEDED' || run.status === 'FAILED') {
      return 'ack';
    }

    const graph = await this.loadGraph(run);

    if (!graph) {
      await this.fail(run, 'authorization_mismatch', now, null);
      return 'ack';
    }

    if (!this.gate.tryEnter(run.tenantId)) {
      return 'delay';
    }

    const started = Date.now();
    let firstFragmentAt: number | null = null;
    let sawDelta = false;

    try {
      const claim = await this.store.transaction(async (tx) => {
        const locked = await tx.lockRun(run.id);

        if (!locked) {
          return { kind: 'missing' as const };
        }

        const decision = decideClaim(locked, now, this.config.leaseMs);

        if (decision.kind === 'claimed') {
          await tx.saveRun(decision.run);
        }

        return decision;
      });

      if (claim.kind === 'missing') {
        return 'dead';
      }

      if (claim.kind === 'terminal') {
        return 'ack';
      }

      if (claim.kind === 'wait') {
        return 'delay';
      }

      const claimed = claim.run;
      const assistantCount = await this.store.countAssistantMessages(
        claimed.tenantId,
        claimed.id,
      );

      if (assistantCount > 0) {
        await this.markExistingSuccess(claimed, now);
        return 'ack';
      }

      await this.notify({
        runId: claimed.id,
        sequence: this.nextSequence(claimed.id),
        status: 'PROCESSING',
        type: 'run.processing',
      });
      const messages = await this.providerMessages(graph.history);

      if (this.exceedsBudget(messages)) {
        await this.fail(claimed, 'context_limit', now, Date.now() - started);
        return 'ack';
      }

      const projectTurn = await this.finishProjectCardTurn(
        claimed,
        graph.history,
        started,
      );

      if (projectTurn) {
        return 'ack';
      }

      const result = await this.provider.stream(
        {
          apiKey: this.config.openRouterApiKey,
          baseUrl: this.config.openRouterBaseUrl,
          idleTimeoutMs: this.config.streamIdleTimeoutMs,
          maxOutputTokens: this.config.maxOutputTokens,
          maxResponseBytes: this.config.maxProviderResponseBytes,
          messages,
          model: selectProviderModel(
            messages,
            claimed.requestedModel,
            this.config.openRouterVisionModel,
          ),
          timeoutMs: this.config.providerTimeoutMs,
        },
        {
          onDelta: async (delta) => {
            sawDelta = true;
            firstFragmentAt ??= Date.now();
            await this.extendLease(claimed.id);

            for (const part of splitDelta(delta)) {
              await this.notify({
                delta: part,
                runId: claimed.id,
                sequence: this.nextSequence(claimed.id),
                type: 'run.delta',
              });
            }
          },
        },
      );
      const completedAt = new Date();
      await this.persistSuccess(claimed, result.content, {
        completedAt,
        durationMs: completedAt.getTime() - started,
        effectiveModel: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      });
      this.metrics.recordSuccess({
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        providerDurationMs: completedAt.getTime() - started,
        tenantId: claimed.tenantId,
        timeToCompletionMs: completedAt.getTime() - claimed.createdAt.getTime(),
        timeToFirstFragmentMs:
          firstFragmentAt === null ? null : firstFragmentAt - started,
      });
      await this.notify({
        content: result.content,
        runId: claimed.id,
        sequence: this.nextSequence(claimed.id),
        status: 'SUCCEEDED',
        type: 'run.completed',
      });
      this.logger.log(`run_succeeded ${claimed.id}`);
      return 'ack';
    } catch (error) {
      const providerError =
        error instanceof ProviderError
          ? error
          : new ProviderError('provider_unavailable', true);
      const retryable = providerError.retryable && !sawDelta;
      const current = await this.store.findRunById(run.id);
      const attempt = current?.attempt ?? run.attempt;

      if (retryable && attempt < this.config.retryLimit) {
        await this.defer(run.id, attempt, now);
        this.metrics.recordRetry();
        this.logger.warn(`run_retry ${run.id} ${providerError.code}`);
        return 'retry';
      }

      await this.fail(
        current ?? run,
        providerError.code,
        now,
        Date.now() - started,
      );
      this.logger.warn(`run_failed ${run.id} ${providerError.code}`);
      return retryable ? 'dead' : 'ack';
    } finally {
      this.gate.leave(run.tenantId);
    }
  }

  private async loadGraph(run: RunRecord): Promise<{
    history: MessageRecord[];
  } | null> {
    const [conversation, actor, userMessage] = await Promise.all([
      this.store.findConversationById(run.conversationId),
      this.store.findActor(run.requesterUserId),
      this.store.findMessageById(run.userMessageId),
    ]);

    if (
      !conversation ||
      !actor ||
      !userMessage ||
      conversation.tenantId !== run.tenantId ||
      conversation.ownerUserId !== run.requesterUserId ||
      conversation.id !== run.conversationId ||
      !actorAllowed(actor, run) ||
      userMessage.id !== run.userMessageId ||
      userMessage.tenantId !== run.tenantId ||
      userMessage.conversationId !== run.conversationId ||
      userMessage.role !== 'user' ||
      userMessage.authorUserId !== run.requesterUserId
    ) {
      return null;
    }

    const history = await this.store.listMessages(
      run.tenantId,
      run.conversationId,
    );

    if (
      history.some(
        (message) =>
          message.tenantId !== run.tenantId ||
          message.conversationId !== run.conversationId,
      )
    ) {
      return null;
    }

    return { history };
  }

  private async finishProjectCardTurn(
    claimed: RunRecord,
    history: MessageRecord[],
    started: number,
  ): Promise<boolean> {
    if (!this.projectCards) {
      return false;
    }

    const actor = await this.store.findActor(claimed.requesterUserId);
    const userMessage = history.find(
      (message) => message.id === claimed.userMessageId,
    );
    const previousUserMessages = history
      .filter(
        (message) =>
          message.role === 'user' &&
          message.sequence < (userMessage?.sequence ?? 0),
      )
      .map((message) => message.content);

    if (!actor || !userMessage) {
      return false;
    }

    const turn = await this.projectCards.handleTurn({
      actor: {
        id: actor.id,
        profile: actor.profile,
        sessionId: claimed.id,
        tenantId: claimed.tenantId,
      },
      message: userMessage.content,
      previousUserMessages,
      runId: claimed.id,
      trace: claimed.toolTrace ?? [],
    });

    if (!turn) {
      return false;
    }

    const completedAt = new Date();
    await this.store.saveRun({
      ...claimed,
      toolTrace: turn.trace,
      updatedAt: completedAt,
    });

    for (const part of splitDelta(turn.reply)) {
      await this.notify({
        delta: part,
        runId: claimed.id,
        sequence: this.nextSequence(claimed.id),
        type: 'run.delta',
      });
    }

    await this.persistSuccess(claimed, turn.reply, {
      completedAt,
      durationMs: completedAt.getTime() - started,
      effectiveModel: null,
      inputTokens: null,
      outputTokens: null,
    });
    await this.notify({
      content: turn.reply,
      runId: claimed.id,
      sequence: this.nextSequence(claimed.id),
      status: 'SUCCEEDED',
      type: 'run.completed',
    });
    this.logger.log(`run_succeeded ${claimed.id}`);
    return true;
  }

  private async providerMessages(
    history: MessageRecord[],
  ): Promise<ProviderMessage[]> {
    const enriched = await Promise.all(
      history.map(async (message) => {
        if (message.role !== 'user') {
          return {
            content: message.content,
            role: message.role,
          };
        }

        const files = await this.attachments.resolveForMessage(
          message.tenantId,
          message.id,
        );

        if (files.length === 0) {
          return {
            content: message.content,
            role: message.role,
          };
        }

        return {
          content: buildUserProviderContent(message.content, files),
          role: message.role,
        };
      }),
    );

    return buildProviderMessages({
      history: enriched,
      maxInputTokens: this.config.maxInputTokens,
      maxMessages: this.config.maxHistoryMessages,
      systemInstructions: `${this.config.systemInstructions}\n\n${PROJECT_CARD_POLICY}`,
    });
  }

  private exceedsBudget(messages: ProviderMessage[]): boolean {
    return (
      messages.reduce(
        (total, message) => total + estimateMessageTokens(message.content),
        0,
      ) > this.config.maxInputTokens
    );
  }

  private async persistSuccess(
    run: RunRecord,
    content: string,
    meta: {
      completedAt: Date;
      durationMs: number;
      effectiveModel: string | null;
      inputTokens: number | null;
      outputTokens: number | null;
    },
  ): Promise<void> {
    await this.store.transaction(async (tx) => {
      const current = await tx.lockRun(run.id);

      if (!current || current.status === 'SUCCEEDED') {
        return;
      }

      const existing = await tx.countAssistantMessages(
        current.tenantId,
        current.id,
      );

      if (existing > 0) {
        await tx.saveRun({
          ...current,
          completedAt: meta.completedAt,
          durationMs: meta.durationMs,
          effectiveModel: meta.effectiveModel,
          errorCode: null,
          errorMessage: null,
          inputTokens: meta.inputTokens,
          leaseExpiresAt: null,
          outputTokens: meta.outputTokens,
          status: 'SUCCEEDED',
          updatedAt: meta.completedAt,
        });
        return;
      }

      const messageId = randomUUID();
      const sequence = await tx.nextSequence(
        current.tenantId,
        current.conversationId,
      );
      await tx.insertMessage({
        authorUserId: null,
        content,
        conversationId: current.conversationId,
        createdAt: meta.completedAt,
        id: messageId,
        role: 'assistant',
        runId: current.id,
        sequence,
        tenantId: current.tenantId,
        updatedAt: meta.completedAt,
      });
      await tx.saveRun({
        ...current,
        assistantMessageId: messageId,
        completedAt: meta.completedAt,
        durationMs: meta.durationMs,
        effectiveModel: meta.effectiveModel,
        errorCode: null,
        errorMessage: null,
        inputTokens: meta.inputTokens,
        leaseExpiresAt: null,
        outputTokens: meta.outputTokens,
        status: 'SUCCEEDED',
        updatedAt: meta.completedAt,
      });
      await tx.touchConversation(current.conversationId, meta.completedAt);
    });
  }

  private async markExistingSuccess(run: RunRecord, now: Date): Promise<void> {
    await this.store.transaction(async (tx) => {
      const current = await tx.lockRun(run.id);

      if (
        !current ||
        current.status === 'SUCCEEDED' ||
        current.status === 'FAILED'
      ) {
        return;
      }

      await tx.saveRun({
        ...current,
        completedAt: now,
        errorCode: null,
        errorMessage: null,
        leaseExpiresAt: null,
        status: 'SUCCEEDED',
        updatedAt: now,
      });
    });
  }

  private async defer(
    runId: string,
    attempt: number,
    now: Date,
  ): Promise<void> {
    const delay =
      this.config.retryBackoffMs[
        Math.min(attempt - 1, this.config.retryBackoffMs.length - 1)
      ] ?? this.config.retryBackoffMs[0];
    await this.store.transaction(async (tx) => {
      const current = await tx.lockRun(runId);

      if (
        !current ||
        current.status === 'SUCCEEDED' ||
        current.status === 'FAILED'
      ) {
        return;
      }

      await tx.saveRun({
        ...current,
        leaseExpiresAt: new Date(now.getTime() + delay),
        status: 'QUEUED',
        updatedAt: now,
      });
    });
  }

  private async fail(
    run: RunRecord,
    errorCode: string,
    now: Date,
    durationMs: number | null,
  ): Promise<void> {
    let changed = false;
    await this.store.transaction(async (tx) => {
      const current = await tx.lockRun(run.id);

      if (
        !current ||
        current.status === 'SUCCEEDED' ||
        current.status === 'FAILED'
      ) {
        return;
      }

      changed = true;
      await tx.saveRun({
        ...current,
        completedAt: now,
        durationMs,
        errorCode,
        errorMessage: USER_SAFE_FAILURE,
        leaseExpiresAt: null,
        status: 'FAILED',
        updatedAt: now,
      });
    });

    if (!changed) {
      return;
    }

    this.metrics.recordState('FAILED');
    await this.notify({
      errorCode,
      errorMessage: USER_SAFE_FAILURE,
      runId: run.id,
      sequence: this.nextSequence(run.id),
      status: 'FAILED',
      type: 'run.failed',
    });
  }

  private async extendLease(runId: string): Promise<void> {
    const now = new Date();
    await this.store.transaction(async (tx) => {
      const current = await tx.lockRun(runId);

      if (!current || current.status !== 'PROCESSING') {
        return;
      }

      await tx.saveRun({
        ...current,
        leaseExpiresAt: new Date(now.getTime() + this.config.leaseMs),
        updatedAt: now,
      });
    });
  }

  private async notify(event: RunStreamEvent): Promise<void> {
    try {
      await this.notifier.publish(event);
    } catch {
      this.logger.warn(`notify_failed ${event.runId}`);
    }
  }

  private nextSequence(runId: string): number {
    const next = (this.sequences.get(runId) ?? 0) + 1;
    this.sequences.set(runId, next);
    return next;
  }
}

function actorAllowed(actor: StoredActor, run: RunRecord): boolean {
  if (actor.id !== run.requesterUserId || actor.status !== 'active') {
    return false;
  }

  if (!hasMappedAction(actor, 'vetorAgent')) {
    return false;
  }

  return actor.profile === 'Administrador' || actor.tenantId === run.tenantId;
}

function splitDelta(delta: string): string[] {
  const parts: string[] = [];

  for (let index = 0; index < delta.length; index += DELTA_CHAR_LIMIT) {
    parts.push(delta.slice(index, index + DELTA_CHAR_LIMIT));
  }

  return parts;
}
