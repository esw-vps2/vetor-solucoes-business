export function parseDuration(value: string, fallbackSeconds: number): number {
  const match = value.match(/^(\d+)(s|m|h|d)$/);

  if (!match) {
    return fallbackSeconds;
  }

  const amount = Number(match[1]);
  const multiplier =
    match[2] === 'd'
      ? 86400
      : match[2] === 'h'
        ? 3600
        : match[2] === 'm'
          ? 60
          : 1;

  return amount * multiplier;
}
