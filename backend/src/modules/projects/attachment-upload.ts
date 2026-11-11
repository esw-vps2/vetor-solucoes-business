import { diskStorage, memoryStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import {
  isFinanceDocumentMime,
  MAX_FINANCE_DOCUMENT_BYTES,
} from './finance-document-file.js';
import { MAX_CONTRACT_PDF_BYTES } from './finance-amounts.js';
import {
  isAttachmentMime,
  isBackgroundMime,
  MAX_ATTACHMENT_BYTES,
  MAX_BACKGROUND_BYTES,
  MAX_PROJECT_DOCUMENT_NODES,
} from './project-constants.js';

export const attachmentUploadOptions = {
  fileFilter: (
    _request: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!isAttachmentMime(file.mimetype)) {
      callback(new BadRequestException('Invalid input.'), false);
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: MAX_ATTACHMENT_BYTES,
    files: 1,
  },
  storage: memoryStorage(),
};

export const backgroundUploadOptions = {
  fileFilter: (
    _request: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!isBackgroundMime(file.mimetype)) {
      callback(new BadRequestException('Invalid input.'), false);
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: MAX_BACKGROUND_BYTES,
    files: 1,
  },
  storage: memoryStorage(),
};

export const documentUploadOptions = {
  fileFilter: (
    _request: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!isAttachmentMime(file.mimetype)) {
      callback(new BadRequestException('Invalid input.'), false);
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: MAX_ATTACHMENT_BYTES,
    files: MAX_PROJECT_DOCUMENT_NODES,
  },
  storage: diskStorage({
    destination: tmpdir(),
    filename: (_request, _file, callback) => {
      callback(null, `vetor-doc-${randomUUID()}`);
    },
  }),
};

export const contractFileUploadOptions = {
  fileFilter: (
    _request: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (file.mimetype !== 'application/pdf') {
      callback(new BadRequestException('Invalid input.'), false);
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: MAX_CONTRACT_PDF_BYTES,
    files: 1,
  },
  storage: memoryStorage(),
};

export const financeDocumentUploadOptions = {
  fileFilter: (
    _request: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!isFinanceDocumentMime(file.mimetype)) {
      callback(new BadRequestException('Invalid input.'), false);
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: MAX_FINANCE_DOCUMENT_BYTES,
    files: 1,
  },
  storage: memoryStorage(),
};

export function tempDocumentPath(filename: string): string {
  return join(tmpdir(), filename);
}
