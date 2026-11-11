export const RUN_STATUSES = [
  'QUEUED',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
] as const;

export type RunStatus = (typeof RUN_STATUSES)[number];

export const MESSAGE_ROLES = ['user', 'assistant'] as const;

export type MessageRole = (typeof MESSAGE_ROLES)[number];

export const AI_PROVIDER = 'openrouter';

export const AI_EVENT_TYPE = 'ai.run.requested';

export const AI_COMMAND_EXCHANGE = 'ai.commands';

export const AI_RETRY_EXCHANGE = 'ai.retry';

export const AI_DEAD_LETTER_EXCHANGE = 'ai.dlx';

export const AI_NOTIFY_CHANNEL = 'ai_run_events';

export const DEFAULT_QUEUE_NAME = 'ai.runs';

export const MAX_MESSAGE_CHARS = 8000;

export const PREVIEW_CHARS = 80;

export const MAX_CONVERSATION_TITLE_CHARS = 120;

export const NOTIFY_CHAR_LIMIT = 7000;

export const DELTA_CHAR_LIMIT = 1500;

export const AI_STORE = Symbol('AI_STORE');
