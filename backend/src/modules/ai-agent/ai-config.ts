import type { ConfigService } from '@nestjs/config';
import { DEFAULT_QUEUE_NAME, MAX_MESSAGE_CHARS } from './ai-agent.constants.js';

export interface AiRuntimeConfig {
  rabbitUrl: string;
  queueName: string;
  retryLimit: number;
  retryBackoffMs: number[];
  openRouterApiKey: string;
  openRouterBaseUrl: string;
  openRouterModel: string;
  openRouterVisionModel: string;
  systemInstructions: string;
  maxInputTokens: number;
  maxHistoryMessages: number;
  maxOutputTokens: number;
  providerTimeoutMs: number;
  streamIdleTimeoutMs: number;
  maxConcurrentRuns: number;
  maxConcurrentRunsPerTenant: number;
  maxSseConnections: number;
  maxSseConnectionsPerOwner: number;
  maxProviderResponseBytes: number;
  messageMaxChars: number;
  leaseMs: number;
  outboxPollMs: number;
  workerHealthPort: number;
  heartbeatMs: number;
}

const DEFAULT_INSTRUCTIONS =
  'You are the VETOR assistant. Answer only from this conversation. Do not claim access to projects, expenses, tickets, or files.';

export function readAiConfig(config: ConfigService): AiRuntimeConfig {
  return {
    rabbitUrl: text(
      config,
      'RABBITMQ_URL',
      'amqp://vetor:change-me@rabbitmq:5672',
    ),
    queueName: text(config, 'RABBITMQ_QUEUE', DEFAULT_QUEUE_NAME),
    retryLimit: positiveInt(config, 'RABBITMQ_RETRY_LIMIT', 3),
    retryBackoffMs: backoff(config.get<string>('RABBITMQ_RETRY_BACKOFF')),
    openRouterApiKey: text(config, 'OPENROUTER_API_KEY', ''),
    openRouterBaseUrl: text(
      config,
      'OPENROUTER_BASE_URL',
      'https://openrouter.ai/api/v1',
    ).replace(/\/$/, ''),
    openRouterModel: text(
      config,
      'OPENROUTER_MODEL',
      'openrouter/example-model',
    ),
    openRouterVisionModel: text(
      config,
      'OPENROUTER_VISION_MODEL',
      'nvidia/nemotron-3.5-super-vl:free',
    ),
    systemInstructions: text(
      config,
      'AI_AGENT_SYSTEM_INSTRUCTIONS',
      DEFAULT_INSTRUCTIONS,
    ),
    maxInputTokens: positiveInt(config, 'AI_MAX_INPUT_TOKENS', 8000),
    maxHistoryMessages: positiveInt(config, 'AI_MAX_HISTORY_MESSAGES', 20),
    maxOutputTokens: positiveInt(config, 'AI_MAX_OUTPUT_TOKENS', 2000),
    providerTimeoutMs: positiveInt(config, 'AI_PROVIDER_TIMEOUT_MS', 60000),
    streamIdleTimeoutMs: positiveInt(
      config,
      'AI_STREAM_IDLE_TIMEOUT_MS',
      20000,
    ),
    maxConcurrentRuns: positiveInt(config, 'AI_MAX_CONCURRENT_RUNS', 2),
    maxConcurrentRunsPerTenant: positiveInt(
      config,
      'AI_MAX_CONCURRENT_RUNS_PER_TENANT',
      1,
    ),
    maxSseConnections: positiveInt(config, 'AI_MAX_SSE_CONNECTIONS', 100),
    maxSseConnectionsPerOwner: positiveInt(
      config,
      'AI_MAX_SSE_CONNECTIONS_PER_OWNER',
      4,
    ),
    maxProviderResponseBytes: positiveInt(
      config,
      'AI_MAX_PROVIDER_RESPONSE_BYTES',
      1_048_576,
    ),
    messageMaxChars: Math.min(
      positiveInt(config, 'AI_MAX_MESSAGE_CHARS', MAX_MESSAGE_CHARS),
      MAX_MESSAGE_CHARS,
    ),
    leaseMs: positiveInt(config, 'AI_RUN_LEASE_MS', 120000),
    outboxPollMs: positiveInt(config, 'AI_OUTBOX_POLL_MS', 1000),
    workerHealthPort: positiveInt(config, 'AI_WORKER_HEALTH_PORT', 3002),
    heartbeatMs: positiveInt(config, 'AI_SSE_HEARTBEAT_MS', 15000),
  };
}

export function assertProductionAiConfig(
  config: Record<string, unknown>,
): void {
  const required = [
    'RABBITMQ_URL',
    'OPENROUTER_API_KEY',
    'OPENROUTER_BASE_URL',
    'OPENROUTER_MODEL',
    'AI_AGENT_SYSTEM_INSTRUCTIONS',
  ];
  const missing = required.filter((name) => !stringValue(config[name]));

  if (missing.length > 0) {
    throw new Error(
      `Missing production environment variables: ${missing.join(', ')}`,
    );
  }

  const apiKey = stringValue(config.OPENROUTER_API_KEY);
  const baseUrl = stringValue(config.OPENROUTER_BASE_URL);

  if (isPlaceholder(apiKey) || !baseUrl.startsWith('https://')) {
    throw new Error('Invalid production AI provider configuration.');
  }

  for (const name of [
    'RABBITMQ_RETRY_LIMIT',
    'AI_MAX_INPUT_TOKENS',
    'AI_MAX_HISTORY_MESSAGES',
    'AI_MAX_OUTPUT_TOKENS',
    'AI_PROVIDER_TIMEOUT_MS',
    'AI_STREAM_IDLE_TIMEOUT_MS',
    'AI_MAX_CONCURRENT_RUNS',
    'AI_MAX_CONCURRENT_RUNS_PER_TENANT',
    'AI_MAX_SSE_CONNECTIONS',
    'AI_MAX_SSE_CONNECTIONS_PER_OWNER',
    'AI_MAX_PROVIDER_RESPONSE_BYTES',
    'AI_RUN_LEASE_MS',
    'AI_MAX_MESSAGE_CHARS',
  ]) {
    if (config[name] !== undefined && config[name] !== '') {
      parseRequiredInt(config[name], name);
    }
  }
}

function text(config: ConfigService, key: string, fallback: string): string {
  const value = config.get<string>(key);
  return value && value.trim() ? value.trim() : fallback;
}

function positiveInt(
  config: ConfigService,
  key: string,
  fallback: number,
): number {
  const value = config.get<string>(key);

  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return parseRequiredInt(value, key);
}

function parseRequiredInt(value: unknown, name: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid AI configuration: ${name}`);
  }

  return parsed;
}

function backoff(value: string | undefined): number[] {
  if (!value || !value.trim()) {
    return [1000, 2000, 4000];
  }

  const parts = value.split(',').map((item) => Number(item.trim()));

  if (
    parts.length === 0 ||
    parts.some((item) => !Number.isInteger(item) || item <= 0)
  ) {
    throw new Error('Invalid AI configuration: RABBITMQ_RETRY_BACKOFF');
  }

  return parts;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isPlaceholder(value: string): boolean {
  return /change-me|replace-with|example|placeholder/i.test(value);
}

export function hasProviderCredentials(config: AiRuntimeConfig): boolean {
  return (
    config.openRouterApiKey.length > 0 &&
    !isPlaceholder(config.openRouterApiKey)
  );
}
