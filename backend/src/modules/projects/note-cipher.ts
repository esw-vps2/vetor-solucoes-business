import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

export interface NotePlaintext {
  title: string;
  body: string;
}

export interface NoteCiphertext {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

export function noteKeyFromBase64(value: string | undefined): Buffer {
  const key = Buffer.from(value ?? '', 'base64');

  if (key.length !== 32) {
    throw new Error('Invalid note key.');
  }

  return key;
}

export function encryptNote(key: Buffer, note: NotePlaintext): NoteCiphertext {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(note), 'utf8'),
    cipher.final(),
  ]);

  return { authTag: cipher.getAuthTag(), ciphertext, iv };
}

export function decryptNote(key: Buffer, sealed: NoteCiphertext): NotePlaintext {
  const decipher = createDecipheriv(ALGORITHM, key, sealed.iv);
  decipher.setAuthTag(sealed.authTag);
  const plaintext = Buffer.concat([
    decipher.update(sealed.ciphertext),
    decipher.final(),
  ]).toString('utf8');
  const parsed = JSON.parse(plaintext) as Partial<NotePlaintext>;

  if (typeof parsed.title !== 'string' || typeof parsed.body !== 'string') {
    throw new Error('Invalid note payload.');
  }

  return { body: parsed.body, title: parsed.title };
}
