export interface ParsedFrame {
  done?: boolean;
  delta?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
}

export function consumeSseBuffer(buffer: string): {
  frames: ParsedFrame[];
  rest: string;
  malformed: boolean;
} {
  const lines = buffer.split('\n');
  const rest = lines.pop() ?? '';
  const frames: ParsedFrame[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed.startsWith('data:')) {
      continue;
    }

    const data = trimmed.slice(5).trim();

    if (data === '[DONE]') {
      frames.push({ done: true });
      continue;
    }

    try {
      frames.push(parsePayload(JSON.parse(data) as unknown));
    } catch {
      return { frames, malformed: true, rest: '' };
    }
  }

  return { frames, malformed: false, rest };
}

function parsePayload(value: unknown): ParsedFrame {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const record = value as Record<string, unknown>;
  const model = typeof record.model === 'string' ? record.model : undefined;
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const choice = choices[0] as { delta?: { content?: unknown } } | undefined;
  const content = choice?.delta?.content;
  const usage =
    record.usage && typeof record.usage === 'object'
      ? (record.usage as Record<string, unknown>)
      : undefined;

  return {
    delta:
      typeof content === 'string' && content.length > 0 ? content : undefined,
    inputTokens: numberField(usage, 'prompt_tokens', 'input_tokens'),
    model,
    outputTokens: numberField(usage, 'completion_tokens', 'output_tokens'),
  };
}

function numberField(
  record: Record<string, unknown> | undefined,
  first: string,
  second: string,
): number | undefined {
  const value = record?.[first] ?? record?.[second];
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}
