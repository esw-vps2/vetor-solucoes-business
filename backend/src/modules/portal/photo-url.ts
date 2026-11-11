export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const BRAND_PHOTO_PREFIX = '/brand/';

const PHOTO_CONTENT_TYPES = {
  avif: 'image/avif',
  bmp: 'image/bmp',
  gif: 'image/gif',
  heic: 'image/heic',
  ico: 'image/x-icon',
  jpg: 'image/jpeg',
  png: 'image/png',
  tif: 'image/tiff',
  webp: 'image/webp',
} as const;

export type PhotoExtension = keyof typeof PHOTO_CONTENT_TYPES;

const PHOTO_EXTENSIONS = Object.keys(PHOTO_CONTENT_TYPES).join('|');
const PHOTO_POINTER = new RegExp(
  `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(${PHOTO_EXTENSIONS})$`,
  'i',
);

const HEIC_BRANDS = new Set([
  'heic',
  'heim',
  'heis',
  'heix',
  'hevc',
  'hevx',
  'mif1',
  'msf1',
]);

export function detectPhoto(
  buffer: Buffer,
): { contentType: string; extension: PhotoExtension } | null {
  if (isJpeg(buffer)) {
    return format('jpg');
  }

  if (isPng(buffer)) {
    return format('png');
  }

  if (isGif(buffer)) {
    return format('gif');
  }

  if (isWebp(buffer)) {
    return format('webp');
  }

  if (isBmp(buffer)) {
    return format('bmp');
  }

  if (isIco(buffer)) {
    return format('ico');
  }

  if (isTiff(buffer)) {
    return format('tif');
  }

  const brand = isoBrand(buffer);

  if (brand === 'avif' || brand === 'avis') {
    return format('avif');
  }

  if (brand && HEIC_BRANDS.has(brand)) {
    return format('heic');
  }

  return null;
}

export function photoPointerForUser(
  userId: string,
  extension: PhotoExtension,
): string {
  return `${userId}.${extension}`;
}

export function isPhotoPointer(value: string): boolean {
  return PHOTO_POINTER.test(value);
}

export function photoContentType(pointer: string): string | null {
  const extension = PHOTO_POINTER.exec(pointer)?.[1]?.toLowerCase();

  if (!extension || !(extension in PHOTO_CONTENT_TYPES)) {
    return null;
  }

  return PHOTO_CONTENT_TYPES[extension as PhotoExtension];
}

export function toPublicTenantPhotoUrl(
  tenantId: string,
  stored: string | null | undefined,
): string {
  if (!stored || !isPhotoPointer(stored)) {
    return '';
  }

  return `/api/v1/tenants/${tenantId}/photo`;
}

export function toPublicPhotoUrl(userId: string, stored: string): string {
  if (!stored) {
    return '';
  }

  if (stored.startsWith(BRAND_PHOTO_PREFIX)) {
    return stored;
  }

  if (isPhotoPointer(stored)) {
    return `/api/v1/users/${userId}/photo`;
  }

  return '';
}

function format(extension: PhotoExtension): {
  contentType: string;
  extension: PhotoExtension;
} {
  return { contentType: PHOTO_CONTENT_TYPES[extension], extension };
}

function isJpeg(buffer: Buffer): boolean {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  );
}

function isPng(buffer: Buffer): boolean {
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

function isGif(buffer: Buffer): boolean {
  return (
    buffer.length >= 6 &&
    buffer.toString('ascii', 0, 4) === 'GIF8' &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  );
}

function isWebp(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  );
}

function isBmp(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer[0] === 0x42 && buffer[1] === 0x4d;
}

function isIco(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x00 &&
    buffer[1] === 0x00 &&
    buffer[2] === 0x01 &&
    buffer[3] === 0x00
  );
}

function isTiff(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    ((buffer[0] === 0x49 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x2a &&
      buffer[3] === 0x00) ||
      (buffer[0] === 0x4d &&
        buffer[1] === 0x4d &&
        buffer[2] === 0x00 &&
        buffer[3] === 0x2a))
  );
}

function isoBrand(buffer: Buffer): string | null {
  if (buffer.length < 12 || buffer.toString('ascii', 4, 8) !== 'ftyp') {
    return null;
  }

  return buffer.toString('ascii', 8, 12);
}
