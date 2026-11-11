export function corsOptions(value: string): {
  credentials: true;
  origin: string[];
} {
  return {
    credentials: true,
    origin: value
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0 && origin !== '*'),
  };
}
