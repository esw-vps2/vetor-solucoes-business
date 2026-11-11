import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import { MAX_PHOTO_BYTES } from './photo-url.js';

export const photoUploadOptions = {
  fileFilter: (
    _request: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const type = file.mimetype.toLowerCase();

    if (
      type === 'image/svg+xml' ||
      (!type.startsWith('image/') &&
        type !== 'application/octet-stream' &&
        type !== '')
    ) {
      callback(new BadRequestException('Invalid input.'), false);
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: MAX_PHOTO_BYTES,
    files: 1,
  },
  storage: memoryStorage(),
};
