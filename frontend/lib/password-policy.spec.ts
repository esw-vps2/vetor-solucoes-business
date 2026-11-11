import { describe, expect, it } from 'vitest';
import { PASSWORD_HTML_PATTERN } from './password-policy';

const passwordPattern = new RegExp(`^${PASSWORD_HTML_PATTERN}$`);

describe('PASSWORD_HTML_PATTERN', () => {
  it('accepts a password with letters, numbers, and a special character', () => {
    expect(passwordPattern.test('Ab1!xy')).toBe(true);
    expect(passwordPattern.test('ExamplePassword12!')).toBe(true);
  });

  it('rejects fewer than 6 characters', () => {
    expect(passwordPattern.test('Ab1!x')).toBe(false);
  });

  it('rejects a password without a letter', () => {
    expect(passwordPattern.test('123456!')).toBe(false);
  });

  it('rejects a password without a number', () => {
    expect(passwordPattern.test('Abcdef!')).toBe(false);
  });

  it('rejects a password without a special character', () => {
    expect(passwordPattern.test('Abcdef1')).toBe(false);
    expect(passwordPattern.test('1234567890')).toBe(false);
  });
});
