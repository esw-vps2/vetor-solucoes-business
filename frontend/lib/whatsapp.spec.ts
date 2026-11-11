import { describe, expect, it } from 'vitest';
import { buildWhatsAppClickToChatUrl } from './whatsapp';

describe('buildWhatsAppClickToChatUrl', () => {
  it('builds a wa.me URL from configured digits', () => {
    expect(buildWhatsAppClickToChatUrl('5511999999999')).toBe('https://wa.me/5511999999999');
  });

  it('keeps only digits from an E.164-like value', () => {
    expect(buildWhatsAppClickToChatUrl('+55 11 99999-9999')).toBe('https://wa.me/5511999999999');
  });

  it('returns null when the value is empty', () => {
    expect(buildWhatsAppClickToChatUrl(undefined)).toBeNull();
    expect(buildWhatsAppClickToChatUrl('')).toBeNull();
    expect(buildWhatsAppClickToChatUrl('   ')).toBeNull();
  });

  it('rejects a full URL or any value that is not a phone number', () => {
    expect(buildWhatsAppClickToChatUrl('https://wa.me/5511999999999')).toBeNull();
    expect(buildWhatsAppClickToChatUrl('javascript:alert(1)')).toBeNull();
    expect(buildWhatsAppClickToChatUrl('not-a-number')).toBeNull();
  });
});
