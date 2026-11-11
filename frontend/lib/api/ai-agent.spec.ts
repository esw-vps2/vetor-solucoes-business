import { afterEach, describe, expect, it, vi } from 'vitest';
import { aiRunEventsUrl } from './ai-agent';

describe('aiRunEventsUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the same-origin API path when the public API is loopback', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001');

    expect(aiRunEventsUrl('run-1')).toBe('/api/v1/ai/runs/run-1/events');
  });

  it('keeps a remote API origin for credentialed cross-origin streams', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');

    expect(aiRunEventsUrl('run-1')).toBe('https://api.example.com/api/v1/ai/runs/run-1/events');
  });
});
