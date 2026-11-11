import { PREVIEW_CHARS } from './ai-agent.constants.js';
import type { AiStore } from './ai-store.js';
import type {
  ConversationRecord,
  MessageRecord,
  OutboxRecord,
  RunRecord,
  StoredActor,
} from './ai-agent.types.js';

interface MemoryState {
  actors: StoredActor[];
  tenants: { id: string }[];
  conversations: ConversationRecord[];
  messages: MessageRecord[];
  runs: RunRecord[];
  outbox: OutboxRecord[];
}

export class MemoryAiStore implements AiStore {
  actors: StoredActor[] = [];
  tenants: { id: string }[] = [];
  conversations: ConversationRecord[] = [];
  messages: MessageRecord[] = [];
  runs: RunRecord[] = [];
  outbox: OutboxRecord[] = [];
  failNextOutbox = false;

  async transaction<T>(work: (tx: AiStore) => Promise<T>): Promise<T> {
    const snapshot = this.snapshot();

    try {
      return await work(this);
    } catch (error) {
      this.restore(snapshot);
      throw error;
    }
  }

  async findActor(userId: string): Promise<StoredActor | null> {
    return clone(this.actors.find((actor) => actor.id === userId) ?? null);
  }

  async findTenant(tenantId: string): Promise<{ id: string } | null> {
    return clone(this.tenants.find((tenant) => tenant.id === tenantId) ?? null);
  }

  async insertConversation(record: ConversationRecord): Promise<void> {
    this.conversations.push(clone(record));
  }

  async listConversations(
    tenantId: string,
    ownerUserId: string,
    page: number,
    limit: number,
  ): Promise<ConversationRecord[]> {
    return this.conversations
      .filter(
        (conversation) =>
          conversation.tenantId === tenantId &&
          conversation.ownerUserId === ownerUserId,
      )
      .toSorted(
        (left, right) =>
          right.updatedAt.getTime() - left.updatedAt.getTime() ||
          left.id.localeCompare(right.id),
      )
      .slice((page - 1) * limit, page * limit)
      .map((conversation) => clone(conversation));
  }

  async findOwnedConversation(
    tenantId: string,
    ownerUserId: string,
    conversationId: string,
  ): Promise<ConversationRecord | null> {
    return clone(
      this.conversations.find(
        (conversation) =>
          conversation.id === conversationId &&
          conversation.tenantId === tenantId &&
          conversation.ownerUserId === ownerUserId,
      ) ?? null,
    );
  }

  async lockOwnedConversation(
    tenantId: string,
    ownerUserId: string,
    conversationId: string,
  ): Promise<ConversationRecord | null> {
    return this.findOwnedConversation(tenantId, ownerUserId, conversationId);
  }

  async touchConversation(
    conversationId: string,
    updatedAt: Date,
  ): Promise<void> {
    const conversation = this.conversations.find(
      (item) => item.id === conversationId,
    );

    if (conversation) {
      conversation.updatedAt = new Date(updatedAt);
    }
  }

  async updateConversationTitle(
    tenantId: string,
    ownerUserId: string,
    conversationId: string,
    title: string,
    updatedAt: Date,
  ): Promise<boolean> {
    const conversation = this.conversations.find(
      (item) =>
        item.id === conversationId &&
        item.tenantId === tenantId &&
        item.ownerUserId === ownerUserId,
    );

    if (!conversation) {
      return false;
    }

    conversation.title = title;
    conversation.updatedAt = new Date(updatedAt);
    return true;
  }

  async deleteOwnedConversation(
    tenantId: string,
    ownerUserId: string,
    conversationId: string,
  ): Promise<boolean> {
    const index = this.conversations.findIndex(
      (item) =>
        item.id === conversationId &&
        item.tenantId === tenantId &&
        item.ownerUserId === ownerUserId,
    );

    if (index < 0) {
      return false;
    }

    const runIds = new Set(
      this.runs
        .filter(
          (run) =>
            run.tenantId === tenantId && run.conversationId === conversationId,
        )
        .map((run) => run.id),
    );
    this.outbox = this.outbox.filter((event) => !runIds.has(event.runId));
    this.conversations.splice(index, 1);
    this.messages = this.messages.filter(
      (message) =>
        !(
          message.tenantId === tenantId &&
          message.conversationId === conversationId
        ),
    );
    this.runs = this.runs.filter(
      (run) =>
        !(run.tenantId === tenantId && run.conversationId === conversationId),
    );
    return true;
  }

  async findConversationById(
    conversationId: string,
  ): Promise<ConversationRecord | null> {
    return clone(
      this.conversations.find(
        (conversation) => conversation.id === conversationId,
      ) ?? null,
    );
  }

  async nextSequence(
    tenantId: string,
    conversationId: string,
  ): Promise<number> {
    const sequences = this.messages
      .filter(
        (message) =>
          message.tenantId === tenantId &&
          message.conversationId === conversationId,
      )
      .map((message) => message.sequence);

    return sequences.length === 0 ? 1 : Math.max(...sequences) + 1;
  }

  async findActiveRun(
    tenantId: string,
    conversationId: string,
  ): Promise<RunRecord | null> {
    return clone(
      this.runs.find(
        (run) =>
          run.tenantId === tenantId &&
          run.conversationId === conversationId &&
          (run.status === 'QUEUED' || run.status === 'PROCESSING'),
      ) ?? null,
    );
  }

  async findIdempotentRun(
    tenantId: string,
    conversationId: string,
    requesterUserId: string,
    idempotencyKey: string,
  ): Promise<RunRecord | null> {
    return clone(
      this.runs.find(
        (run) =>
          run.tenantId === tenantId &&
          run.conversationId === conversationId &&
          run.requesterUserId === requesterUserId &&
          run.idempotencyKey === idempotencyKey,
      ) ?? null,
    );
  }

  async insertMessage(record: MessageRecord): Promise<void> {
    this.messages.push(clone(record));
  }

  async insertRun(record: RunRecord): Promise<void> {
    this.runs.push(clone(record));
  }

  async insertOutbox(record: OutboxRecord): Promise<void> {
    if (this.failNextOutbox) {
      this.failNextOutbox = false;
      throw new Error('outbox_unavailable');
    }

    this.outbox.push(clone(record));
  }

  async listMessages(
    tenantId: string,
    conversationId: string,
  ): Promise<MessageRecord[]> {
    return this.messages
      .filter(
        (message) =>
          message.tenantId === tenantId &&
          message.conversationId === conversationId,
      )
      .toSorted((left, right) => left.sequence - right.sequence)
      .map((message) => clone(message));
  }

  async previews(
    tenantId: string,
    conversationIds: string[],
  ): Promise<Map<string, string>> {
    const ids = new Set(conversationIds);
    const previews = new Map<string, string>();

    for (const message of this.messages.toSorted(
      (left, right) => left.sequence - right.sequence,
    )) {
      if (
        message.tenantId !== tenantId ||
        message.role !== 'user' ||
        !ids.has(message.conversationId) ||
        previews.has(message.conversationId)
      ) {
        continue;
      }

      previews.set(
        message.conversationId,
        message.content.slice(0, PREVIEW_CHARS),
      );
    }

    return previews;
  }

  async sumSucceededTokenUsage(
    tenantId: string,
    requesterUserId: string,
  ): Promise<{ inputTokens: number; outputTokens: number }> {
    let inputTokens = 0;
    let outputTokens = 0;

    for (const run of this.runs) {
      if (
        run.tenantId !== tenantId ||
        run.requesterUserId !== requesterUserId ||
        run.status !== 'SUCCEEDED'
      ) {
        continue;
      }

      inputTokens += run.inputTokens ?? 0;
      outputTokens += run.outputTokens ?? 0;
    }

    return { inputTokens, outputTokens };
  }

  async findOwnedRun(
    tenantId: string,
    requesterUserId: string,
    runId: string,
  ): Promise<RunRecord | null> {
    return clone(
      this.runs.find(
        (run) =>
          run.id === runId &&
          run.tenantId === tenantId &&
          run.requesterUserId === requesterUserId,
      ) ?? null,
    );
  }

  async findRunById(runId: string): Promise<RunRecord | null> {
    return clone(this.runs.find((run) => run.id === runId) ?? null);
  }

  async lockRun(runId: string): Promise<RunRecord | null> {
    return this.findRunById(runId);
  }

  async findMessageById(messageId: string): Promise<MessageRecord | null> {
    return clone(
      this.messages.find((message) => message.id === messageId) ?? null,
    );
  }

  async saveRun(run: RunRecord): Promise<void> {
    const index = this.runs.findIndex((item) => item.id === run.id);
    const copy = clone(run);

    if (index >= 0) {
      this.runs[index] = copy;
      return;
    }

    this.runs.push(copy);
  }

  async releaseStaleQueued(olderThan: Date, now: Date): Promise<void> {
    const staleRunIds = new Set(
      this.runs
        .filter(
          (run) =>
            run.status === 'QUEUED' &&
            run.leaseExpiresAt === null &&
            run.createdAt.getTime() <= olderThan.getTime(),
        )
        .map((run) => run.id),
    );

    for (const event of this.outbox) {
      if (
        event.publishedAt !== null &&
        event.publishedAt.getTime() <= olderThan.getTime() &&
        staleRunIds.has(event.runId)
      ) {
        event.publishedAt = null;
        event.updatedAt = now;
      }
    }
  }

  async listUnpublished(now: Date, limit: number): Promise<OutboxRecord[]> {
    return this.outbox
      .filter(
        (event) =>
          event.publishedAt === null &&
          event.availableAt.getTime() <= now.getTime(),
      )
      .toSorted(
        (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
      )
      .slice(0, limit)
      .map((event) => clone(event));
  }

  async saveOutbox(event: OutboxRecord): Promise<void> {
    const index = this.outbox.findIndex((item) => item.id === event.id);
    const copy = clone(event);

    if (index >= 0) {
      this.outbox[index] = copy;
      return;
    }

    this.outbox.push(copy);
  }

  async countByStatus(): Promise<Record<RunRecord['status'], number>> {
    const counts = { QUEUED: 0, PROCESSING: 0, SUCCEEDED: 0, FAILED: 0 };

    for (const run of this.runs) {
      counts[run.status] += 1;
    }

    return counts;
  }

  async queueSnapshot(
    now: Date,
  ): Promise<{ depth: number; oldestAgeMs: number }> {
    const unpublished = this.outbox.filter(
      (event) => event.publishedAt === null,
    );

    if (unpublished.length === 0) {
      return { depth: 0, oldestAgeMs: 0 };
    }

    const oldest = unpublished.reduce((current, event) =>
      event.createdAt < current.createdAt ? event : current,
    );

    return {
      depth: unpublished.length,
      oldestAgeMs: Math.max(0, now.getTime() - oldest.createdAt.getTime()),
    };
  }

  async countAssistantMessages(
    tenantId: string,
    runId: string,
  ): Promise<number> {
    return this.messages.filter(
      (message) =>
        message.tenantId === tenantId &&
        message.runId === runId &&
        message.role === 'assistant',
    ).length;
  }

  private snapshot(): MemoryState {
    return {
      actors: clone(this.actors),
      tenants: clone(this.tenants),
      conversations: clone(this.conversations),
      messages: clone(this.messages),
      runs: clone(this.runs),
      outbox: clone(this.outbox),
    };
  }

  private restore(snapshot: MemoryState): void {
    this.actors = snapshot.actors;
    this.tenants = snapshot.tenants;
    this.conversations = snapshot.conversations;
    this.messages = snapshot.messages;
    this.runs = snapshot.runs;
    this.outbox = snapshot.outbox;
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
