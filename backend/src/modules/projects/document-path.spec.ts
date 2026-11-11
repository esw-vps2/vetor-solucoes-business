import { describe, expect, it } from 'vitest';
import { assertRelativePath } from './document-path.js';

describe('assertRelativePath', () => {
  it('rejects traversal, absolute, and backslash paths', () => {
    expect(() => assertRelativePath('../secret.txt')).toThrow('Invalid input.');
    expect(() => assertRelativePath('/etc/passwd')).toThrow('Invalid input.');
    expect(() => assertRelativePath('folder\\file.txt')).toThrow(
      'Invalid input.',
    );
  });

  it('accepts a posix relative file path', () => {
    expect(assertRelativePath('docs/notes.txt')).toEqual(['docs', 'notes.txt']);
  });
});
