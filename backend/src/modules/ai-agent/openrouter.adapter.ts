import { Injectable } from '@nestjs/common';
import type { ProviderMessage, ProviderResult } from './ai-agent.types.js';
import { ProviderError } from './ai-agent.types.js';
import { consumeSseBuffer } from './openrouter-stream.js';

export interface ProviderStreamInput {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ProviderMessage[];
  maxOutputTokens: number;
  timeoutMs: number;
  idleTimeoutMs: number;
  maxResponseBytes: number;
  signal?: AbortSignal;
}

export interface LlmProvider {
  stream(
    input: ProviderStreamInput,
    handlers: { onDelta: (delta: string) => Promise<void> },
  ): Promise<ProviderResult>;
}

@Injectable()
export class OpenRouterAdapter implements LlmProvider {
  async stream(
    input: ProviderStreamInput,
    handlers: { onDelta: (delta: string) => Promise<void> },
  ): Promise<ProviderResult> {
    if (!input.apiKey) {
      throw new ProviderError('provider_unavailable', false);
    }

    const idle = new AbortController();
    let idleTimer: NodeJS.Timeout | undefined;
    const bumpIdle = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }

      idleTimer = setTimeout(() => {
        idle.abort(new ProviderError('provider_timeout', true));
      }, input.idleTimeoutMs);
    };

    bumpIdle();
    const timeout = AbortSignal.timeout(input.timeoutMs);
    const signal = AbortSignal.any(
      [timeout, idle.signal, input.signal].filter(
        (item): item is AbortSignal => item !== undefined,
      ),
    );

    try {
      const response = await fetch(`${input.baseUrl}/chat/completions`, {
        body: JSON.stringify({
          max_tokens: input.maxOutputTokens,
          messages: input.messages,
          model: input.model,
          stream: true,
        }),
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        redirect: 'manual',
        signal,
      });

      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel();
        throw new ProviderError('provider_rejected', false);
      }

      if (!response.ok) {
        await response.body?.cancel();
        throw httpError(response.status);
      }

      if (!response.body) {
        throw new ProviderError('malformed_stream', true);
      }

      return await readBody(
        response.body,
        handlers,
        bumpIdle,
        input.maxResponseBytes,
      );
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      if (signal.aborted || isTimeout(error)) {
        throw new ProviderError('provider_timeout', true);
      }

      throw new ProviderError('provider_unavailable', true);
    } finally {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
    }
  }
}

async function readBody(
  body: ReadableStream<Uint8Array>,
  handlers: { onDelta: (delta: string) => Promise<void> },
  bumpIdle: () => void,
  maxResponseBytes: number,
): Promise<ProviderResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let rest = '';
  let content = '';
  let model: string | null = null;
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;
  let sawDelta = false;
  let receivedBytes = 0;

  while (true) {
    const chunk = await reader.read();
    bumpIdle();

    if (chunk.done) {
      break;
    }

    receivedBytes += chunk.value.byteLength;

    if (receivedBytes > maxResponseBytes) {
      await reader.cancel();
      throw new ProviderError('provider_rejected', false);
    }

    rest += decoder.decode(chunk.value, { stream: true });
    const parsed = consumeSseBuffer(rest);
    rest = parsed.rest;

    if (parsed.malformed) {
      throw new ProviderError('malformed_stream', !sawDelta);
    }

    for (const frame of parsed.frames) {
      if (frame.model) {
        model = frame.model;
      }

      if (frame.inputTokens !== undefined) {
        inputTokens = frame.inputTokens;
      }

      if (frame.outputTokens !== undefined) {
        outputTokens = frame.outputTokens;
      }

      if (frame.delta) {
        sawDelta = true;
        content += frame.delta;
        await handlers.onDelta(frame.delta);
      }

      if (frame.done) {
        return { content, inputTokens, model, outputTokens };
      }
    }
  }

  if (!content) {
    throw new ProviderError('malformed_stream', true);
  }

  return { content, inputTokens, model, outputTokens };
}

function httpError(status: number): ProviderError {
  if (status === 429) {
    return new ProviderError('provider_rate_limit', true);
  }

  if (status === 408 || status >= 500) {
    return new ProviderError('provider_unavailable', true);
  }

  return new ProviderError('provider_rejected', false);
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  );
}
