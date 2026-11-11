import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '@/app/manifest';

describe('PWA manifest', () => {
  it('is installable for / and /portal with the VETOR logo and start URL /', () => {
    const document = manifest();

    expect(document.start_url).toBe('/');
    expect(document.display).toBe('standalone');
    expect(document.icons?.[0]?.src).toBe('/brand/logo_vetor.png');
    expect(
      readFileSync(join(process.cwd(), 'public/brand/logo_vetor.png')).byteLength,
    ).toBeGreaterThan(8_000);
  });
});
