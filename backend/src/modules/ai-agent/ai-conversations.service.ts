import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hasMappedAction } from '../portal/enabled-actions.js';
import type { AuthenticatedUser } from '../portal/auth.types.js';
import { Tenant } from '../portal/entities/tenant.entity.js';
import {
  AI_EVENT_TYPE,
  AI_STORE,
  MAX_CONVERSATION_TITLE_CHARS,
  PREVIEW_CHARS,
} from './ai-agent.constants.js';
import { AiAttachmentsService } from './ai-attachments.service.js';
import { readAiConfig, type AiRuntimeConfig } from './ai-config.js';
import type { AiStore } from './ai-store.js';
import type { RunRecord } from './ai-agent.types.js';

export interface ConversationSummary {
  id: string;
  title: string | null;
  preview: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationCreated {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachmentView {
  id: string;
  originalName: string;
  mimeType: string;
}

export interface MessageView {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sequence: number;
  createdAt: string;
  attachments: MessageAttachmentView[];
}

export interface RunSubmission {
  runId: string;
  conversationId: string;
  messageId: string;
  status: RunRecord['status'];
}

export interface RunStatusView {
  id: string;
  conversationId: string;
  messageId: string;
  status: RunRecord['status'];
  requestedModel: string;
  effectiveModel: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number | null;
  attempt: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  assistantMessageId: string | null;
  assistantContent: string | null;
}

interface ActorScope {
  userId: string;
  tenantId: string;
}

@Injectable()
export class AiConversationsService {
  private readonly config: AiRuntimeConfig;

  constructor(
    @Inject(AI_STORE) private readonly store: AiStore,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    private readonly attachments: AiAttachmentsService,
    config: ConfigService,
  ) {
    this.config = readAiConfig(config);
  }

  async getPricing(
    session: AuthenticatedUser,
  ): Promise<{ tokenCostPerMillion: number; usageCost: number }> {
    const scope = await this.authorize(session);
    const [shared] = await this.tenants.find({
      order: { name: 'ASC' },
      take: 1,
    });
    const tokenCostPerMillion = shared
      ? Number(shared.aiTokenCostPerMillion)
      : 0.6;
    const usage = await this.store.sumSucceededTokenUsage(
      scope.tenantId,
      scope.userId,
    );

    return {
      tokenCostPerMillion,
      usageCost: usageCostFromTokens(
        usage.inputTokens + usage.outputTokens,
        tokenCostPerMillion,
      ),
    };
  }

  async createConversation(
    session: AuthenticatedUser,
  ): Promise<ConversationCreated> {
    const scope = await this.authorize(session);
    const now = new Date();
    const record = {
      createdAt: now,
      id: randomUUID(),
      ownerUserId: scope.userId,
      tenantId: scope.tenantId,
      title: null,
      updatedAt: now,
    };
    await this.store.insertConversation(record);

    return {
      createdAt: now.toISOString(),
      id: record.id,
      updatedAt: now.toISOString(),
    };
  }

  async listConversations(
    session: AuthenticatedUser,
    page: number,
    limit: number,
  ): Promise<{ items: ConversationSummary[]; page: number; limit: number }> {
    const scope = await this.authorize(session);
    const conversations = await this.store.listConversations(
      scope.tenantId,
      scope.userId,
      page,
      limit,
    );
    const previews = await this.store.previews(
      scope.tenantId,
      conversations.map((conversation) => conversation.id),
    );

    return {
      items: conversations.map((conversation) => ({
        createdAt: conversation.createdAt.toISOString(),
        id: conversation.id,
        preview: (previews.get(conversation.id) ?? '').slice(0, PREVIEW_CHARS),
        title: conversation.title,
        updatedAt: conversation.updatedAt.toISOString(),
      })),
      limit,
      page,
    };
  }

  async renameConversation(
    session: AuthenticatedUser,
    conversationId: string,
    title: string,
  ): Promise<ConversationSummary> {
    const scope = await this.authorize(session);
    const trimmed = title.trim();

    if (trimmed.length === 0 || trimmed.length > MAX_CONVERSATION_TITLE_CHARS) {
      throw new BadRequestException('Invalid input.');
    }

    const now = new Date();
    const updated = await this.store.updateConversationTitle(
      scope.tenantId,
      scope.userId,
      conversationId,
      trimmed,
      now,
    );

    if (!updated) {
      throw new NotFoundException('Not found.');
    }

    return this.summaryFor(scope, conversationId);
  }

  async deleteConversation(
    session: AuthenticatedUser,
    conversationId: string,
  ): Promise<void> {
    const scope = await this.authorize(session);
    const owned = await this.store.findOwnedConversation(
      scope.tenantId,
      scope.userId,
      conversationId,
    );

    if (!owned) {
      throw new NotFoundException('Not found.');
    }

    const active = await this.store.findActiveRun(
      scope.tenantId,
      conversationId,
    );

    if (active) {
      throw new ConflictException(
        'A run is already active for this conversation.',
      );
    }

    await this.attachments.deleteForConversation(
      scope.tenantId,
      conversationId,
    );
    const deleted = await this.store.deleteOwnedConversation(
      scope.tenantId,
      scope.userId,
      conversationId,
    );

    if (!deleted) {
      throw new NotFoundException('Not found.');
    }
  }

  private async summaryFor(
    scope: ActorScope,
    conversationId: string,
  ): Promise<ConversationSummary> {
    const conversation = await this.store.findOwnedConversation(
      scope.tenantId,
      scope.userId,
      conversationId,
    );

    if (!conversation) {
      throw new NotFoundException('Not found.');
    }

    const previews = await this.store.previews(scope.tenantId, [
      conversationId,
    ]);

    return {
      createdAt: conversation.createdAt.toISOString(),
      id: conversation.id,
      preview: (previews.get(conversationId) ?? '').slice(0, PREVIEW_CHARS),
      title: conversation.title,
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  async listMessages(
    session: AuthenticatedUser,
    conversationId: string,
  ): Promise<MessageView[]> {
    const scope = await this.authorize(session);
    const conversation = await this.store.findOwnedConversation(
      scope.tenantId,
      scope.userId,
      conversationId,
    );

    if (!conversation) {
      throw new NotFoundException('Not found.');
    }

    const messages = await this.store.listMessages(
      scope.tenantId,
      conversationId,
    );
    const attachments = await this.attachments.listBoundByMessage(
      scope.tenantId,
      scope.userId,
      conversationId,
    );

    return messages.map((message) => ({
      attachments: attachments.get(message.id) ?? [],
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      id: message.id,
      role: message.role,
      sequence: message.sequence,
    }));
  }

  async submitMessage(
    session: AuthenticatedUser,
    conversationId: string,
    content: string,
    attachmentIds: string[] = [],
    idempotencyKey?: string,
  ): Promise<RunSubmission> {
    const scope = await this.authorize(session);

    if (content.length > this.config.messageMaxChars) {
      throw new BadRequestException('Invalid input.');
    }

    const result = await this.store.transaction(async (tx) => {
      const conversation = await tx.lockOwnedConversation(
        scope.tenantId,
        scope.userId,
        conversationId,
      );

      if (!conversation) {
        return { kind: 'missing' as const };
      }

      if (idempotencyKey) {
        const existing = await tx.findIdempotentRun(
          scope.tenantId,
          conversationId,
          scope.userId,
          idempotencyKey,
        );

        if (existing) {
          return { kind: 'replay' as const, run: existing };
        }
      }

      const active = await tx.findActiveRun(scope.tenantId, conversationId);

      if (active) {
        return { kind: 'conflict' as const, runId: active.id };
      }

      const now = new Date();
      const messageId = randomUUID();
      const runId = randomUUID();
      const sequence = await tx.nextSequence(scope.tenantId, conversationId);
      await tx.insertMessage({
        authorUserId: scope.userId,
        content,
        conversationId,
        createdAt: now,
        id: messageId,
        role: 'user',
        runId,
        sequence,
        tenantId: scope.tenantId,
        updatedAt: now,
      });
      await tx.insertRun({
        assistantMessageId: null,
        attempt: 0,
        completedAt: null,
        conversationId,
        createdAt: now,
        durationMs: null,
        effectiveModel: null,
        errorCode: null,
        errorMessage: null,
        id: runId,
        idempotencyKey: idempotencyKey ?? null,
        inputTokens: null,
        leaseExpiresAt: null,
        outputTokens: null,
        provider: 'openrouter',
        requestedModel: this.config.openRouterModel,
        requesterUserId: scope.userId,
        startedAt: null,
        status: 'QUEUED',
        tenantId: scope.tenantId,
        updatedAt: now,
        userMessageId: messageId,
      });
      await tx.insertOutbox({
        attemptCount: 0,
        availableAt: now,
        createdAt: now,
        eventType: AI_EVENT_TYPE,
        id: randomUUID(),
        lastError: null,
        payload: { runId, version: 1 },
        publishedAt: null,
        runId,
        tenantId: scope.tenantId,
        updatedAt: now,
      });
      await tx.touchConversation(conversationId, now);

      return { kind: 'created' as const, messageId, runId };
    });

    if (result.kind === 'missing') {
      throw new NotFoundException('Not found.');
    }

    if (result.kind === 'conflict') {
      throw new ConflictException({
        message: 'A run is already active for this conversation.',
        runId: result.runId,
      });
    }

    if (result.kind === 'replay') {
      return {
        conversationId,
        messageId: result.run.userMessageId,
        runId: result.run.id,
        status: result.run.status,
      };
    }

    await this.attachments.bindToMessage(
      scope.tenantId,
      scope.userId,
      conversationId,
      result.messageId,
      attachmentIds,
    );

    return {
      conversationId,
      messageId: result.messageId,
      runId: result.runId,
      status: 'QUEUED',
    };
  }

  async getRun(
    session: AuthenticatedUser,
    runId: string,
  ): Promise<RunStatusView> {
    const scope = await this.authorize(session);
    const run = await this.store.findOwnedRun(
      scope.tenantId,
      scope.userId,
      runId,
    );

    if (!run) {
      throw new NotFoundException('Not found.');
    }

    return this.toRunView(run);
  }

  async ownedRun(
    session: AuthenticatedUser,
    runId: string,
  ): Promise<{ scope: ActorScope; run: RunRecord }> {
    const scope = await this.authorize(session);
    const run = await this.store.findOwnedRun(
      scope.tenantId,
      scope.userId,
      runId,
    );

    if (!run) {
      throw new NotFoundException('Not found.');
    }

    return { run, scope };
  }

  async toRunView(run: RunRecord): Promise<RunStatusView> {
    let assistantContent: string | null = null;

    if (run.status === 'SUCCEEDED' && run.assistantMessageId) {
      const message = await this.store.findMessageById(run.assistantMessageId);
      assistantContent =
        message &&
        message.tenantId === run.tenantId &&
        message.conversationId === run.conversationId &&
        message.role === 'assistant'
          ? message.content
          : null;
    }

    return {
      assistantContent,
      assistantMessageId: run.assistantMessageId,
      attempt: run.attempt,
      completedAt: iso(run.completedAt),
      conversationId: run.conversationId,
      createdAt: run.createdAt.toISOString(),
      durationMs: run.durationMs,
      effectiveModel: run.effectiveModel,
      errorCode: run.status === 'FAILED' ? run.errorCode : null,
      errorMessage: run.status === 'FAILED' ? run.errorMessage : null,
      id: run.id,
      inputTokens: run.inputTokens,
      messageId: run.userMessageId,
      outputTokens: run.outputTokens,
      requestedModel: run.requestedModel,
      startedAt: iso(run.startedAt),
      status: run.status,
    };
  }

  private async authorize(session: AuthenticatedUser): Promise<ActorScope> {
    const actor = await this.store.findActor(session.id);

    if (!actor || actor.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!hasMappedAction(actor, 'vetorAgent')) {
      throw new ForbiddenException('Access denied.');
    }

    if (actor.profile === 'Administrador') {
      const tenant = await this.store.findTenant(session.tenantId);

      if (!tenant) {
        throw new ForbiddenException('Access denied.');
      }

      return { tenantId: session.tenantId, userId: actor.id };
    }

    return { tenantId: actor.tenantId, userId: actor.id };
  }
}

export function usageCostFromTokens(
  totalTokens: number,
  tokenCostPerMillion: number,
): number {
  const rateScaled = Math.round(tokenCostPerMillion * 10000);
  return (totalTokens * rateScaled) / 10_000_000_000;
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}
