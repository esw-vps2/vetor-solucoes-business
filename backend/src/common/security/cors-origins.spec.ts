import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { corsOptions } from './cors-origins.js';

describe('corsOptions', () => {
  it('allows the dedicated portal origin with credentials and keeps the local origin', () => {
    expect(
      corsOptions(
        'http://localhost:3000,https://portal.vps2.com.br,https://app.vps2.com.br',
      ),
    ).toEqual({
      credentials: true,
      origin: [
        'http://localhost:3000',
        'https://portal.vps2.com.br',
        'https://app.vps2.com.br',
      ],
    });
  });

  it('keeps the dedicated portal origin in the backend example and drops a wildcard', () => {
    const example = readFileSync(
      resolve(
        dirname(fileURLToPath(import.meta.url)),
        '../../../../infrastructure/.env.backend.example',
      ),
      'utf8',
    );
    const corsLine = example
      .split('\n')
      .find((line) => line.startsWith('CORS='));
    const options = corsOptions(corsLine?.slice('CORS='.length) ?? '');

    expect(options.credentials).toBe(true);
    expect(options.origin).toContain('http://vps2.com.br:3000');
    expect(options.origin).toContain('http://app.vps2.com.br:3000');
    expect(options.origin).toContain('https://vps2.com.br');
    expect(options.origin).toContain('https://app.vps2.com.br');
    expect(options.origin).not.toContain('*');
  });

  it('trims entries and drops blanks and a wildcard', () => {
    expect(
      corsOptions(' http://localhost:3000 , * ,https://portal.vps2.com.br, '),
    ).toEqual({
      credentials: true,
      origin: ['http://localhost:3000', 'https://portal.vps2.com.br'],
    });
  });
});
