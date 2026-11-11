import { PASSWORD_PATTERN } from './password-policy.js';

describe('PASSWORD_PATTERN', () => {
  it('accepts a password with letters, numbers, and a special character', () => {
    expect(PASSWORD_PATTERN.test('Ab1!xy')).toBe(true);
    expect(PASSWORD_PATTERN.test('ExamplePassword12!')).toBe(true);
  });

  it('rejects fewer than 6 characters', () => {
    expect(PASSWORD_PATTERN.test('Ab1!x')).toBe(false);
  });

  it('rejects a password without a letter', () => {
    expect(PASSWORD_PATTERN.test('123456!')).toBe(false);
  });

  it('rejects a password without a number', () => {
    expect(PASSWORD_PATTERN.test('Abcdef!')).toBe(false);
  });

  it('rejects a password without a special character', () => {
    expect(PASSWORD_PATTERN.test('Abcdef1')).toBe(false);
    expect(PASSWORD_PATTERN.test('1234567890')).toBe(false);
  });
});
