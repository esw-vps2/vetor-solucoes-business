import { extname } from 'node:path';

const AI_POINTER =
  /^ai\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/i;

const MIME_EXTENSION: Record<string, string> = {
  'application/json': 'json',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'text/csv': 'csv',
  'text/markdown': 'md',
  'text/plain': 'txt',
};

export const MAX_AI_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const MAX_AI_ATTACHMENTS_PER_MESSAGE = 5;

export function isAiAttachmentPointer(pointer: string): boolean {
  return AI_POINTER.test(pointer);
}

export function aiAttachmentPointerFor(id: string, extension: string): string {
  return `ai/${id}.${extension}`;
}

export function extensionForAiUpload(
  mimeType: string,
  originalName: string,
): string {
  const mapped = MIME_EXTENSION[mimeType.toLowerCase()];

  if (mapped) {
    return mapped;
  }

  const fromName = extname(originalName).replace(/^\./, '').toLowerCase();

  if (/^[a-z0-9]{1,8}$/.test(fromName)) {
    return fromName;
  }

  return 'bin';
}

export function isAllowedAiUploadMime(mimeType: string): boolean {
  const normalized = mimeType.toLowerCase();

  if (normalized === 'application/octet-stream') {
    return true;
  }

  if (normalized.startsWith('text/')) {
    return true;
  }

  if (normalized.startsWith('image/')) {
    return true;
  }

  return normalized in MIME_EXTENSION;
}
