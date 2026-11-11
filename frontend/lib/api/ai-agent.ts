import { apiRequest } from './client';
import { publicApiBaseUrl } from '../public-api-url';

export interface AiConversationCreated {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiConversationSummary {
  id: string;
  title: string | null;
  preview: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiConversationList {
  items: AiConversationSummary[];
  page: number;
  limit: number;
}

export interface AiMessageAttachment {
  id: string;
  originalName: string;
  mimeType: string;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sequence: number;
  createdAt: string;
  attachments?: AiMessageAttachment[];
}

export function aiAttachmentUrl(conversationId: string, attachmentId: string): string {
  const base = publicApiBaseUrl(
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_API_PROXY,
  );
  return `${base}/api/v1/ai/conversations/${encodeURIComponent(conversationId)}/attachments/${encodeURIComponent(attachmentId)}`;
}

export interface AiRunSubmission {
  runId: string;
  conversationId: string;
  messageId: string;
  status: 'QUEUED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
}

export interface AiRunStatus {
  id: string;
  conversationId: string;
  messageId: string;
  status: AiRunSubmission['status'];
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

export interface AiStreamEvent {
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
  status?: AiRunSubmission['status'];
}

const STREAM_EVENTS = [
  'run.queued',
  'run.processing',
  'run.delta',
  'run.completed',
  'run.failed',
  'run.heartbeat',
] as const;

export function listAiConversations(): Promise<AiConversationList> {
  return apiRequest<AiConversationList>('/ai/conversations');
}

export function createAiConversation(): Promise<AiConversationCreated> {
  return apiRequest<AiConversationCreated>('/ai/conversations', {
    body: JSON.stringify({}),
    method: 'POST',
  });
}

export function listAiMessages(conversationId: string): Promise<AiMessage[]> {
  return apiRequest<AiMessage[]>(`/ai/conversations/${conversationId}/messages`);
}

export function sendAiMessage(
  conversationId: string,
  content: string,
  attachmentIds: string[] = [],
  idempotencyKey?: string,
): Promise<AiRunSubmission> {
  return apiRequest<AiRunSubmission>(`/ai/conversations/${conversationId}/messages`, {
    body: JSON.stringify({
      attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
      content,
    }),
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    method: 'POST',
  });
}

export interface AiAttachmentUpload {
  id: string;
  conversationId: string;
  originalName: string;
  mimeType: string;
  expiresAt: string;
  createdAt: string;
}

export interface AiPricing {
  tokenCostPerMillion: number;
  usageCost: number;
}

export function getAiPricing(): Promise<AiPricing> {
  return apiRequest<AiPricing>('/ai/pricing');
}

export function uploadAiAttachment(
  conversationId: string,
  file: File,
): Promise<AiAttachmentUpload> {
  const body = new FormData();
  body.append('file', file);
  return apiRequest<AiAttachmentUpload>(`/ai/conversations/${conversationId}/attachments`, {
    body,
    method: 'POST',
  });
}

export function renameAiConversation(
  conversationId: string,
  title: string,
): Promise<AiConversationSummary> {
  return apiRequest<AiConversationSummary>(`/ai/conversations/${conversationId}`, {
    body: JSON.stringify({ title }),
    method: 'PATCH',
  });
}

export function deleteAiConversation(conversationId: string): Promise<void> {
  return apiRequest<void>(`/ai/conversations/${conversationId}`, {
    method: 'DELETE',
  });
}

export function getAiRun(runId: string): Promise<AiRunStatus> {
  return apiRequest<AiRunStatus>(`/ai/runs/${runId}`);
}

export function aiRunEventsUrl(runId: string): string {
  const base = publicApiBaseUrl(
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_API_PROXY,
  );
  return `${base}/api/v1/ai/runs/${encodeURIComponent(runId)}/events`;
}

export function subscribeToAiRun(
  runId: string,
  handlers: {
    onEvent: (event: AiStreamEvent) => void;
    onDisconnect: () => void;
  },
): () => void {
  const source = new EventSource(aiRunEventsUrl(runId), { withCredentials: true });

  for (const type of STREAM_EVENTS) {
    source.addEventListener(type, (event) => {
      const message = event as MessageEvent<string>;
      handlers.onEvent(JSON.parse(message.data) as AiStreamEvent);
    });
  }

  source.onerror = () => {
    source.close();
    handlers.onDisconnect();
  };

  return () => source.close();
}
