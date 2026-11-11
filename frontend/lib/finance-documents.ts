export const MAX_FINANCE_DOCUMENT_BYTES = 25 * 1024 * 1024;

const FINANCE_DOCUMENT_MIMES = new Set([
  'application/msword',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/json',
  'audio/aac',
  'audio/flac',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/x-wav',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv',
  'text/markdown',
  'text/plain',
]);

export const FINANCE_DOCUMENT_ACCEPT = [
  '.doc',
  '.docx',
  '.pdf',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  '.md',
  '.json',
  '.zip',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.mp3',
  '.wav',
  '.m4a',
  '.ogg',
  '.weba',
  '.aac',
  '.flac',
].join(',');

export function isAllowedFinanceDocumentType(file: File): boolean {
  return file.type.length === 0 || FINANCE_DOCUMENT_MIMES.has(file.type);
}
