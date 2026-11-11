import type {
  ConversationRecord,
  MessageRecord,
  OutboxRecord,
  RunRecord,
  StoredActor,
} from './ai-agent.types.js';

export interface AiStore {
  transaction<T>(work: (tx: AiStore) => Promise<T>): Promise<T>;
  findActor(userId: string): Promise<StoredActor | null>;
  findTenant(tenantId: string): Promise<{ id: string } | null>;
  insertConversation(record: ConversationRecord): Promise<void>;
  listConversations(
    tenantId: string,
    ownerUserId: string,
    page: number,
    limit: number,
  ): Promise<ConversationRecord[]>;
  findOwnedConversation(
    tenantId: string,
    ownerUserId: string,
    conversationId: string,
  ): Promise<ConversationRecord | null>;
  lockOwnedConversation(
    tenantId: string,
    ownerUserId: string,
    conversationId: string,
  ): Promise<ConversationRecord | null>;
  touchConversation(conversationId: string, updatedAt: Date): Promise<void>;
  updateConversationTitle(
    tenantId: string,
    ownerUserId: string,
    conversationId: string,
    title: string,
    updatedAt: Date,
  ): Promise<boolean>;
  deleteOwnedConversation(
    tenantId: string,
    ownerUserId: string,
    conversationId: string,
  ): Promise<boolean>;
  findConversationById(
    conversationId: string,
  ): Promise<ConversationRecord | null>;
  nextSequence(tenantId: string, conversationId: string): Promise<number>;
  findActiveRun(
    tenantId: string,
    conversationId: string,
  ): Promise<RunRecord | null>;
  findIdempotentRun(
    tenantId: string,
    conversationId: string,
    requesterUserId: string,
    idempotencyKey: string,
  ): Promise<RunRecord | null>;
  insertMessage(record: MessageRecord): Promise<void>;
  insertRun(record: RunRecord): Promise<void>;
  insertOutbox(record: OutboxRecord): Promise<void>;
  listMessages(
    tenantId: string,
    conversationId: string,
  ): Promise<MessageRecord[]>;
  previews(
    tenantId: string,
    conversationIds: string[],
  ): Promise<Map<string, string>>;
  findOwnedRun(
    tenantId: string,
    requesterUserId: string,
    runId: string,
  ): Promise<RunRecord | null>;
  sumSucceededTokenUsage(
    tenantId: string,
    requesterUserId: string,
  ): Promise<{ inputTokens: number; outputTokens: number }>;
  findRunById(runId: string): Promise<RunRecord | null>;
  lockRun(runId: string): Promise<RunRecord | null>;
  findMessageById(messageId: string): Promise<MessageRecord | null>;
  saveRun(run: RunRecord): Promise<void>;
  listUnpublished(now: Date, limit: number): Promise<OutboxRecord[]>;
  releaseStaleQueued(olderThan: Date, now: Date): Promise<void>;
  saveOutbox(event: OutboxRecord): Promise<void>;
  countByStatus(): Promise<Record<RunRecord['status'], number>>;
  queueSnapshot(now: Date): Promise<{ depth: number; oldestAgeMs: number }>;
  countAssistantMessages(tenantId: string, runId: string): Promise<number>;
}
