import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { metadata } from './layout';

const appDir = join(process.cwd(), 'app');

describe('Root layout metadata', () => {
  it('keeps the approved document title', () => {
    expect(metadata.title).toBe('VETOR | Business & Technology');
  });

  it('ships the VETOR mark as the document icon', () => {
    const icon = join(appDir, 'icon.png');
    const favicon = join(appDir, 'favicon.ico');
    const symbol = join(process.cwd(), 'public/brand/symbol-vetor.png');

    expect(existsSync(icon)).toBe(true);
    expect(existsSync(favicon)).toBe(true);
    expect(existsSync(symbol)).toBe(true);

    const png = readFileSync(icon);
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(png.byteLength).toBeGreaterThan(8_000);
  });

  it('declares an installable web app', () => {
    expect(metadata.appleWebApp).toEqual(
      expect.objectContaining({
        capable: true,
        title: 'VETOR',
      }),
    );
  });
});
