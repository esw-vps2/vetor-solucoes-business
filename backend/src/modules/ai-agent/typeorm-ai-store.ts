import {
  DataSource,
  EntityManager,
  In,
  IsNull,
  LessThanOrEqual,
  type Repository,
} from 'typeorm';
import { PREVIEW_CHARS } from './ai-agent.constants.js';
import type { AiStore } from './ai-store.js';
import type {
  ConversationRecord,
  MessageRecord,
  OutboxRecord,
  RunRecord,
  StoredActor,
} from './ai-agent.types.js';
import { AiConversation } from './entities/ai-conversation.entity.js';
import { AiMessage } from './entities/ai-message.entity.js';
import { AiRun } from './entities/ai-run.entity.js';
import { OutboxEvent } from './entities/outbox-event.entity.js';
import { Tenant } from '../portal/entities/tenant.entity.js';
import { User } from '../portal/entities/user.entity.js';

export class TypeormAiStore implements AiStore {
  constructor(
    private readonly dataSource: DataSource,
    private readonly manager?: EntityManager,
  ) {}

  async transaction<T>(work: (tx: AiStore) => Promise<T>): Promise<T> {
    if (this.manager) {
      return work(this);
    }

    return this.dataSource.transaction((manager) =>
      work(new TypeormAiStore(this.dataSource, manager)),
    );
  }

  async findActor(userId: string): Promise<StoredActor | null> {
    const user = await this.repo(User).findOne({ where: { id: userId } });

    if (!user) {
      return null;
    }

    return {
      enabledActions: user.enabledActions ?? [],
      id: user.id,
      profile: user.profile,
      status: user.status,
      tenantId: user.tenantId,
    };
  }

  async findTenant(tenantId: string): Promise<{ id: string } | null> {
    const tenant = await this.repo(Tenant).findOne({ where: { id: tenantId } });
    return tenant ? { id: tenant.id } : null;
  }

  async insertConversation(record: ConversationRecord): Promise<void> {
    await this.repo(AiConversation).save(record);
  }

  async listConversations(
    tenantId: string,
    ownerUserId: string,
    page: number,
    limit: number,
  ): Promise<ConversationRecord[]> {
    const rows = await this.repo(AiConversation).find({
      order: { updatedAt: 'DESC', id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
      where: { ownerUserId, tenantId },
    });

    return rows.map(toConversation);
  }

  async findOwnedConversation(
    tenantId: string,
    ownerUserId: string,
    conversationId: string,
  ): Promise<ConversationRecord | null> {
    const row = await this.repo(AiConversation).findOne({
      where: { id: conversationId, ownerUserId, tenantId },
    });
    return row ? toConversation(row) : null;
  }

  async lockOwnedConversation(
    tenantId: string,
    ownerUserId: string,
    conversationId: string,
  ): Promise<ConversationRecord | null> {
    const row = await this.repo(AiConversation).findOne({
      lock: this.lock(),
      where: { id: conversationId, ownerUserId, tenantId },
    });
    return row ? toConversation(row) : null;
  }

  async touchConversation(
    conversationId: string,
    updatedAt: Date,
  ): Promise<void> {
    await this.repo(AiConversation).update(
      { id: conversationId },
      { updatedAt },
    );
  }

  async updateConversationTitle(
    tenantId: string,
    ownerUserId: string,
    conversationId: string,
    title: string,
    updatedAt: Date,
  ): Promise<boolean> {
    const result = await this.repo(AiConversation).update(
      { id: conversationId, ownerUserId, tenantId },
      { title, updatedAt },
    );
    return (result.affected ?? 0) > 0;
  }

  async deleteOwnedConversation(
    tenantId: string,
    ownerUserId: string,
    conversationId: string,
  ): Promise<boolean> {
    const result = await this.repo(AiConversation).delete({
      id: conversationId,
      ownerUserId,
      tenantId,
    });
    return (result.affected ?? 0) > 0;
  }

  async findConversationById(
    conversationId: string,
  ): Promise<ConversationRecord | null> {
    const row = await this.repo(AiConversation).findOne({
      where: { id: conversationId },
    });
    return row ? toConversation(row) : null;
  }

  async nextSequence(
    tenantId: string,
    conversationId: string,
  ): Promise<number> {
    const raw = await this.repo(AiMessage)
      .createQueryBuilder('message')
      .select('COALESCE(MAX(message.sequence), 0)', 'max')
      .where('message.tenantId = :tenantId', { tenantId })
      .andWhere('message.conversationId = :conversationId', { conversationId })
      .getRawOne<{ max: string | number }>();
    return Number(raw?.max ?? 0) + 1;
  }

  async findActiveRun(
    tenantId: string,
    conversationId: string,
  ): Promise<RunRecord | null> {
    const row = await this.repo(AiRun).findOne({
      where: {
        conversationId,
        status: In(['QUEUED', 'PROCESSING']),
        tenantId,
      },
    });
    return row ? toRun(row) : null;
  }

  async findIdempotentRun(
    tenantId: string,
    conversationId: string,
    requesterUserId: string,
    idempotencyKey: string,
  ): Promise<RunRecord | null> {
    const row = await this.repo(AiRun).findOne({
      where: { conversationId, idempotencyKey, requesterUserId, tenantId },
    });
    return row ? toRun(row) : null;
  }

  async insertMessage(record: MessageRecord): Promise<void> {
    await this.repo(AiMessage).save(record);
  }

  async insertRun(record: RunRecord): Promise<void> {
    await this.repo(AiRun).save(toRunEntity(record));
  }

  async insertOutbox(record: OutboxRecord): Promise<void> {
    await this.repo(OutboxEvent).save(record);
  }

  async listMessages(
    tenantId: string,
    conversationId: string,
  ): Promise<MessageRecord[]> {
    const rows = await this.repo(AiMessage).find({
      order: { sequence: 'ASC' },
      where: { conversationId, tenantId },
    });
    return rows.map(toMessage);
  }

  async previews(
    tenantId: string,
    conversationIds: string[],
  ): Promise<Map<string, string>> {
    const previews = new Map<string, string>();

    if (conversationIds.length === 0) {
      return previews;
    }

    const rows = await this.repo(AiMessage).find({
      order: { sequence: 'ASC' },
      where: {
        conversationId: In(conversationIds),
        role: 'user',
        tenantId,
      },
    });

    for (const row of rows) {
      if (!previews.has(row.conversationId)) {
        previews.set(row.conversationId, row.content.slice(0, PREVIEW_CHARS));
      }
    }

    return previews;
  }

  async sumSucceededTokenUsage(
    tenantId: string,
    requesterUserId: string,
  ): Promise<{ inputTokens: number; outputTokens: number }> {
    const row = await this.repo(AiRun)
      .createQueryBuilder('run')
      .select('COALESCE(SUM(COALESCE(run.inputTokens, 0)), 0)', 'inputTokens')
      .addSelect(
        'COALESCE(SUM(COALESCE(run.outputTokens, 0)), 0)',
        'outputTokens',
      )
      .where('run.tenantId = :tenantId', { tenantId })
      .andWhere('run.requesterUserId = :requesterUserId', { requesterUserId })
      .andWhere('run.status = :status', { status: 'SUCCEEDED' })
      .getRawOne<{
        inputTokens: string | number;
        outputTokens: string | number;
      }>();

    return {
      inputTokens: Number(row?.inputTokens ?? 0),
      outputTokens: Number(row?.outputTokens ?? 0),
    };
  }

  async findOwnedRun(
    tenantId: string,
    requesterUserId: string,
    runId: string,
  ): Promise<RunRecord | null> {
    const row = await this.repo(AiRun).findOne({
      where: { id: runId, requesterUserId, tenantId },
    });
    return row ? toRun(row) : null;
  }

  async findRunById(runId: string): Promise<RunRecord | null> {
    const row = await this.repo(AiRun).findOne({ where: { id: runId } });
    return row ? toRun(row) : null;
  }

  async lockRun(runId: string): Promise<RunRecord | null> {
    const row = await this.repo(AiRun).findOne({
      lock: this.lock(),
      where: { id: runId },
    });
    return row ? toRun(row) : null;
  }

  async findMessageById(messageId: string): Promise<MessageRecord | null> {
    const row = await this.repo(AiMessage).findOne({
      where: { id: messageId },
    });
    return row ? toMessage(row) : null;
  }

  async saveRun(run: RunRecord): Promise<void> {
    await this.repo(AiRun).save(toRunEntity(run));
  }

  async releaseStaleQueued(olderThan: Date, now: Date): Promise<void> {
    await this.repo(OutboxEvent)
      .createQueryBuilder()
      .update(OutboxEvent)
      .set({ publishedAt: () => 'NULL', updatedAt: now })
      .where('published_at IS NOT NULL')
      .andWhere('published_at <= :olderThan', { olderThan })
      .andWhere(
        `run_id IN (
          SELECT id FROM ai_runs
          WHERE status = 'QUEUED'
            AND lease_expires_at IS NULL
            AND created_at <= :olderThan
        )`,
      )
      .setParameter('olderThan', olderThan)
      .execute();
  }

  async listUnpublished(now: Date, limit: number): Promise<OutboxRecord[]> {
    const rows = await this.repo(OutboxEvent).find({
      lock: this.manager
        ? { mode: 'pessimistic_write', onLocked: 'skip_locked' }
        : undefined,
      order: { createdAt: 'ASC' },
      take: limit,
      where: { availableAt: LessThanOrEqual(now), publishedAt: IsNull() },
    });
    return rows.map(toOutbox);
  }

  async saveOutbox(event: OutboxRecord): Promise<void> {
    await this.repo(OutboxEvent).save(event);
  }

  async countByStatus(): Promise<Record<RunRecord['status'], number>> {
    const counts = { QUEUED: 0, PROCESSING: 0, SUCCEEDED: 0, FAILED: 0 };
    const rows = await this.repo(AiRun)
      .createQueryBuilder('run')
      .select('run.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('run.status')
      .getRawMany<{ status: RunRecord['status']; count: string }>();

    for (const row of rows) {
      counts[row.status] = Number(row.count);
    }

    return counts;
  }

  async queueSnapshot(
    now: Date,
  ): Promise<{ depth: number; oldestAgeMs: number }> {
    const raw = await this.repo(OutboxEvent)
      .createQueryBuilder('event')
      .select('COUNT(*)', 'depth')
      .addSelect('MIN(event.createdAt)', 'oldest')
      .where('event.publishedAt IS NULL')
      .getRawOne<{ depth: string; oldest: Date | string | null }>();
    const depth = Number(raw?.depth ?? 0);

    if (!raw?.oldest || depth === 0) {
      return { depth: 0, oldestAgeMs: 0 };
    }

    return {
      depth,
      oldestAgeMs: Math.max(0, now.getTime() - new Date(raw.oldest).getTime()),
    };
  }

  async countAssistantMessages(
    tenantId: string,
    runId: string,
  ): Promise<number> {
    return this.repo(AiMessage).count({
      where: { role: 'assistant', runId, tenantId },
    });
  }

  private repo<T extends object>(entity: new () => T): Repository<T> {
    return (this.manager ?? this.dataSource.manager).getRepository(entity);
  }

  private lock(): { mode: 'pessimistic_write' } | undefined {
    return this.manager ? { mode: 'pessimistic_write' } : undefined;
  }
}

function toConversation(row: AiConversation): ConversationRecord {
  return {
    createdAt: new Date(row.createdAt),
    id: row.id,
    ownerUserId: row.ownerUserId,
    tenantId: row.tenantId,
    title: row.title,
    updatedAt: new Date(row.updatedAt),
  };
}

function toMessage(row: AiMessage): MessageRecord {
  return {
    authorUserId: row.authorUserId,
    content: row.content,
    conversationId: row.conversationId,
    createdAt: new Date(row.createdAt),
    id: row.id,
    role: row.role,
    runId: row.runId,
    sequence: row.sequence,
    tenantId: row.tenantId,
    updatedAt: new Date(row.updatedAt),
  };
}

function toRun(row: AiRun): RunRecord {
  return {
    assistantMessageId: row.assistantMessageId,
    attempt: row.attempt,
    completedAt: row.completedAt ? new Date(row.completedAt) : null,
    conversationId: row.conversationId,
    createdAt: new Date(row.createdAt),
    durationMs: row.durationMs === null ? null : Number(row.durationMs),
    effectiveModel: row.effectiveModel,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    toolTrace: row.toolTrace ?? null,
    id: row.id,
    idempotencyKey: row.idempotencyKey,
    inputTokens: row.inputTokens,
    leaseExpiresAt: row.leaseExpiresAt ? new Date(row.leaseExpiresAt) : null,
    outputTokens: row.outputTokens,
    provider: 'openrouter',
    requestedModel: row.requestedModel,
    requesterUserId: row.requesterUserId,
    startedAt: row.startedAt ? new Date(row.startedAt) : null,
    status: row.status,
    tenantId: row.tenantId,
    updatedAt: new Date(row.updatedAt),
    userMessageId: row.userMessageId,
  };
}

function toRunEntity(run: RunRecord): AiRun {
  return Object.assign(new AiRun(), run);
}

function toOutbox(row: OutboxEvent): OutboxRecord {
  return {
    attemptCount: row.attemptCount,
    availableAt: new Date(row.availableAt),
    createdAt: new Date(row.createdAt),
    eventType: row.eventType,
    id: row.id,
    lastError: row.lastError,
    payload: { runId: row.payload.runId, version: 1 },
    publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
    runId: row.runId,
    tenantId: row.tenantId,
    updatedAt: new Date(row.updatedAt),
  };
}
