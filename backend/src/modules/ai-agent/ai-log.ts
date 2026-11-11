const REDACTED_KEY =
  /content|prompt|instruction|authorization|cookie|api[-_]?key|password|secret|fragment|delta|path|body/i;

export function sanitizeLogValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const output: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(value)) {
    output[key] = REDACTED_KEY.test(key)
      ? '[redacted]'
      : sanitizeLogValue(item);
  }

  return output;
}
