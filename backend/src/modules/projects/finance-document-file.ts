export const MAX_FINANCE_DOCUMENT_BYTES = 25 * 1024 * 1024;
export const MAX_FINANCE_DOCUMENT_TOTAL_BYTES = 500 * 1024 * 1024;
export const MAX_FINANCE_DOCUMENTS = 200;

const FINANCE_DOCUMENT_MIME_TO_EXTENSION = {
  'application/msword': 'doc',
  'application/pdf': 'pdf',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/zip': 'zip',
  'application/json': 'json',
  'audio/aac': 'aac',
  'audio/flac': 'flac',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/webm': 'weba',
  'audio/x-wav': 'wav',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'text/csv': 'csv',
  'text/markdown': 'md',
  'text/plain': 'txt',
} as const;

export type FinanceDocumentMime =
  keyof typeof FINANCE_DOCUMENT_MIME_TO_EXTENSION;

const FINANCE_DOCUMENT_POINTER = new RegExp(
  `^finance/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(${Object.values(
    FINANCE_DOCUMENT_MIME_TO_EXTENSION,
  ).join('|')})$`,
  'i',
);

export function isFinanceDocumentMime(
  value: string,
): value is FinanceDocumentMime {
  return value in FINANCE_DOCUMENT_MIME_TO_EXTENSION;
}

export function financeDocumentExtension(mime: FinanceDocumentMime): string {
  return FINANCE_DOCUMENT_MIME_TO_EXTENSION[mime];
}

export const FINANCE_DOCUMENT_EXTENSIONS = [
  ...new Set(Object.values(FINANCE_DOCUMENT_MIME_TO_EXTENSION)),
];

export function financeDocumentPointerFor(
  tenantId: string,
  projectId: string,
  documentId: string,
  mime: FinanceDocumentMime,
): string {
  return `finance/${tenantId}/${projectId}/${documentId}.${FINANCE_DOCUMENT_MIME_TO_EXTENSION[mime]}`;
}

export function isFinanceDocumentPointer(value: string): boolean {
  return FINANCE_DOCUMENT_POINTER.test(value);
}

export function matchesFinanceDocumentExtension(
  originalName: string,
  mime: FinanceDocumentMime,
): boolean {
  const extension = originalName.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();

  if (!extension) {
    return false;
  }

  if (mime === 'audio/mp4') {
    return extension === 'm4a' || extension === 'mp4';
  }

  if (mime === 'audio/webm') {
    return extension === 'weba' || extension === 'webm';
  }

  if (mime === 'image/jpeg') {
    return extension === 'jpg' || extension === 'jpeg';
  }

  return extension === FINANCE_DOCUMENT_MIME_TO_EXTENSION[mime];
}

export function safeFinanceDocumentName(
  name: string | undefined,
): string | null {
  const value = name?.trim() ?? '';

  if (
    value.length === 0 ||
    value.includes('/') ||
    value.includes('\\') ||
    value.includes('..') ||
    value.startsWith('.')
  ) {
    return null;
  }

  const cleaned = value.replace(/[^\w.\- ()]/g, '_').slice(0, 255);
  return cleaned.length > 0 ? cleaned : null;
}

export function matchesDeclaredFinanceDocumentType(
  mime: string,
  buffer: Buffer,
): mime is FinanceDocumentMime {
  if (!isFinanceDocumentMime(mime) || buffer.length === 0) {
    return false;
  }

  if (mime === 'application/pdf') {
    return buffer.subarray(0, 4).equals(Buffer.from('%PDF'));
  }

  if (
    mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime ===
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mime === 'application/zip'
  ) {
    return isZipBuffer(buffer);
  }

  if (
    mime === 'application/msword' ||
    mime === 'application/vnd.ms-excel' ||
    mime === 'application/vnd.ms-powerpoint'
  ) {
    return isOleBuffer(buffer);
  }

  if (mime === 'application/json') {
    return isJsonBuffer(buffer);
  }

  if (mime === 'image/gif') {
    return (
      buffer.subarray(0, 6).toString('ascii') === 'GIF89a' ||
      buffer.subarray(0, 6).toString('ascii') === 'GIF87a'
    );
  }

  if (mime === 'image/jpeg') {
    return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  }

  if (mime === 'image/png') {
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (mime === 'image/webp') {
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  if (mime === 'audio/wav' || mime === 'audio/x-wav') {
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WAVE'
    );
  }

  if (mime === 'audio/mp4') {
    return buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  }

  if (mime === 'audio/ogg') {
    return buffer.subarray(0, 4).toString('ascii') === 'OggS';
  }

  if (mime === 'audio/webm') {
    return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  }

  if (mime === 'audio/aac') {
    return (
      buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xf6) === 0xf0
    );
  }

  if (mime === 'audio/flac') {
    return buffer.subarray(0, 4).toString('ascii') === 'fLaC';
  }

  if (mime === 'audio/mpeg') {
    return (
      buffer.subarray(0, 3).toString('ascii') === 'ID3' || hasMpegFrame(buffer)
    );
  }

  return isSafeTextBuffer(buffer);
}

function hasMpegFrame(buffer: Buffer): boolean {
  const limit = Math.min(buffer.length - 1, 4096);

  for (let index = 0; index < limit; index += 1) {
    if (buffer[index] === 0xff && (buffer[index + 1] & 0xe0) === 0xe0) {
      return true;
    }
  }

  return false;
}

function isZipBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
    (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08)
  );
}

function isOleBuffer(buffer: Buffer): boolean {
  return buffer
    .subarray(0, 8)
    .equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
}

function isTextBuffer(buffer: Buffer): boolean {
  return !buffer.includes(0);
}

function isSafeTextBuffer(buffer: Buffer): boolean {
  if (!isTextBuffer(buffer)) {
    return false;
  }

  const prefix = buffer
    .toString('utf8')
    .trimStart()
    .slice(0, 512)
    .toLowerCase();
  return !/^<!doctype\s+html|^<html(?:\s|>)|^<svg(?:\s|>)|^<script(?:\s|>)/.test(
    prefix,
  );
}

function isJsonBuffer(buffer: Buffer): boolean {
  if (!isTextBuffer(buffer)) {
    return false;
  }

  try {
    JSON.parse(buffer.toString('utf8'));
    return true;
  } catch {
    return false;
  }
}
