const listeners = new Set<() => void>();

export function subscribeProjectNavRefresh(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyProjectNavRefresh(): void {
  for (const listener of listeners) {
    listener();
  }
}
