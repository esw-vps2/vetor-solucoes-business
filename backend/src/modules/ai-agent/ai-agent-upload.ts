import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import {
  isAllowedAiUploadMime,
  MAX_AI_ATTACHMENT_BYTES,
} from './ai-attachment-file.js';

export const aiAgentUploadOptions = {
  fileFilter: (
    _request: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!isAllowedAiUploadMime(file.mimetype)) {
      callback(new BadRequestException('Invalid input.'), false);
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: MAX_AI_ATTACHMENT_BYTES,
    files: 1,
  },
  storage: memoryStorage(),
};
