import type { MessageRole, RunStatus } from './ai-agent.constants.js';
import type { ToolTraceEntry } from './project-card-match.js';

export interface ConversationRecord {
  id: string;
  tenantId: string;
  ownerUserId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRecord {
  id: string;
  tenantId: string;
  conversationId: string;
  runId: string;
  sequence: number;
  role: MessageRole;
  content: string;
  authorUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RunRecord {
  id: string;
  tenantId: string;
  conversationId: string;
  requesterUserId: string;
  userMessageId: string;
  assistantMessageId: string | null;
  idempotencyKey: string | null;
  status: RunStatus;
  provider: 'openrouter';
  requestedModel: string;
  effectiveModel: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number | null;
  attempt: number;
  leaseExpiresAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  toolTrace?: ToolTraceEntry[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutboxPayload {
  version: 1;
  runId: string;
}

export interface OutboxRecord {
  id: string;
  tenantId: string;
  runId: string;
  eventType: string;
  payload: OutboxPayload;
  attemptCount: number;
  availableAt: Date;
  publishedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredActor {
  id: string;
  tenantId: string;
  profile: string;
  status: string;
  enabledActions: string[];
}

export interface QueueReference {
  eventId: string;
  runId: string;
}

export type DeliveryDecision = 'ack' | 'retry' | 'delay' | 'dead';

export type ClaimResult =
  | { kind: 'claimed'; run: RunRecord }
  | { kind: 'terminal'; run: RunRecord }
  | { kind: 'wait' }
  | { kind: 'missing' };

export type ProviderContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ProviderContentPart[];
}

export interface ProviderResult {
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  content: string;
}

export type ProviderErrorCode =
  | 'provider_timeout'
  | 'provider_rate_limit'
  | 'provider_unavailable'
  | 'malformed_stream'
  | 'provider_rejected';

export class ProviderError extends Error {
  constructor(
    readonly code: ProviderErrorCode,
    readonly retryable: boolean,
  ) {
    super(code);
    this.name = 'ProviderError';
  }
}

export interface RunStreamEvent {
  runId: string;
  type:
    | 'run.queued'
    | 'run.processing'
    | 'run.delta'
    | 'run.completed'
    | 'run.failed'
    | 'run.heartbeat';
  sequence: number;
  delta?: string;
  content?: string;
  errorCode?: string;
  errorMessage?: string;
  status?: RunStatus;
}
