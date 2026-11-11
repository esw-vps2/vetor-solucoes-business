import { describe, expect, it } from 'vitest';
import { isStandaloneDisplay } from './pwa';

describe('isStandaloneDisplay', () => {
  it('detects the standalone display mode used after PWA install', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        addEventListener() {},
        removeEventListener() {},
      }),
    });

    expect(isStandaloneDisplay()).toBe(true);
  });
});
