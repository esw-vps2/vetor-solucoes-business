import type { ProviderMessage } from './ai-agent.types.js';

export interface ContextInput {
  systemInstructions: string;
  history: Array<{
    role: 'user' | 'assistant';
    content: ProviderMessage['content'];
  }>;
  maxMessages: number;
  maxInputTokens: number;
}

export function buildProviderMessages(input: ContextInput): ProviderMessage[] {
  const history = input.history
    .slice(-input.maxMessages)
    .map((message) => ({ role: message.role, content: message.content }));
  const system: ProviderMessage = {
    role: 'system',
    content: input.systemInstructions,
  };
  const selected = trimToBudget([system, ...history], input.maxInputTokens);

  return selected.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateMessageTokens(
  content: ProviderMessage['content'],
): number {
  if (typeof content === 'string') {
    return estimateTokens(content);
  }

  return content.reduce((total, part) => {
    if (part.type === 'text') {
      return total + estimateTokens(part.text);
    }

    return total + estimateTokens(part.image_url.url);
  }, 0);
}

function trimToBudget(
  messages: ProviderMessage[],
  maxInputTokens: number,
): ProviderMessage[] {
  const selected = messages.map((message) => ({ ...message }));

  while (selected.length > 2 && tokenCount(selected) > maxInputTokens) {
    selected.splice(1, 1);
  }

  return selected;
}

function tokenCount(messages: ProviderMessage[]): number {
  return messages.reduce(
    (total, message) => total + estimateMessageTokens(message.content),
    0,
  );
}
