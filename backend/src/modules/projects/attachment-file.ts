import {
  ATTACHMENT_MIME_TO_EXTENSION,
  BACKGROUND_MIME_TO_EXTENSION,
  isAttachmentMime,
  isBackgroundMime,
  type AttachmentMime,
  type BackgroundMime,
} from './project-constants.js';

const POINTER_EXTENSIONS = [
  ...new Set([
    ...Object.values(ATTACHMENT_MIME_TO_EXTENSION),
    ...Object.values(BACKGROUND_MIME_TO_EXTENSION),
  ]),
].join('|');

const ATTACHMENT_POINTER = new RegExp(
  `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(${POINTER_EXTENSIONS})$`,
  'i',
);

export function isJpegBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  );
}

export function isPngBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

export function isGifBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  );
}

export function isWebpBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  );
}

export function isPdfBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  );
}

export function isZipBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
    (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08)
  );
}

export function isOleBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1
  );
}

export function isTextBuffer(buffer: Buffer): boolean {
  return !buffer.includes(0);
}

export function isJsonBuffer(buffer: Buffer): boolean {
  if (!isTextBuffer(buffer) || buffer.length === 0) {
    return false;
  }

  try {
    JSON.parse(buffer.toString('utf8'));
    return true;
  } catch {
    return false;
  }
}

const CONTRACT_POINTER =
  /^contracts\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.pdf$/i;

export function isAttachmentPointer(value: string): boolean {
  return ATTACHMENT_POINTER.test(value);
}

export function isContractPointer(value: string): boolean {
  return CONTRACT_POINTER.test(value);
}

export function contractPointerFor(projectId: string): string {
  return `contracts/${projectId}.pdf`;
}

export function contractFileId(pointer: string): string | null {
  return CONTRACT_POINTER.exec(pointer)?.[1] ?? null;
}

export function attachmentPointerFor(
  attachmentId: string,
  mime: AttachmentMime,
): string {
  return `${attachmentId}.${ATTACHMENT_MIME_TO_EXTENSION[mime]}`;
}

export function backgroundPointerFor(
  projectId: string,
  mime: BackgroundMime,
): string {
  return `${projectId}.${BACKGROUND_MIME_TO_EXTENSION[mime]}`;
}

export function matchesDeclaredAttachmentType(
  mime: string,
  buffer: Buffer,
): mime is AttachmentMime {
  if (!isAttachmentMime(mime)) {
    return false;
  }

  if (mime === 'image/jpeg') {
    return isJpegBuffer(buffer);
  }

  if (mime === 'image/png') {
    return isPngBuffer(buffer);
  }

  if (mime === 'image/gif') {
    return isGifBuffer(buffer);
  }

  if (mime === 'image/webp') {
    return isWebpBuffer(buffer);
  }

  if (mime === 'application/pdf') {
    return isPdfBuffer(buffer);
  }

  if (
    mime === 'application/zip' ||
    mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime ===
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
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

  return isTextBuffer(buffer);
}

export function matchesDeclaredBackgroundType(
  mime: string,
  buffer: Buffer,
): mime is BackgroundMime {
  if (!isBackgroundMime(mime)) {
    return false;
  }

  if (mime === 'image/jpeg') {
    return isJpegBuffer(buffer);
  }

  if (mime === 'image/png') {
    return isPngBuffer(buffer);
  }

  return isWebpBuffer(buffer);
}
