import { decryptNote, encryptNote, noteKeyFromBase64 } from './note-cipher.js';

const key = Buffer.from('0123456789abcdef0123456789abcdef');

describe('note cipher', () => {
  it('round-trips a note and does not store the plaintext', () => {
    const sealed = encryptNote(key, { body: 'sigilo', title: 'Contrato' });

    expect(sealed.ciphertext.toString('utf8')).not.toContain('sigilo');
    expect(sealed.ciphertext.toString('utf8')).not.toContain('Contrato');
    expect(decryptNote(key, sealed)).toEqual({ body: 'sigilo', title: 'Contrato' });
  });

  it('rejects a key that is not 32 bytes', () => {
    expect(() => noteKeyFromBase64(Buffer.from('short').toString('base64'))).toThrow(
      'Invalid note key.',
    );
  });

  it('rejects a tampered ciphertext', () => {
    const sealed = encryptNote(key, { body: 'sigilo', title: 'Contrato' });
    sealed.ciphertext[0] ^= 1;

    expect(() => decryptNote(key, sealed)).toThrow();
  });
});
