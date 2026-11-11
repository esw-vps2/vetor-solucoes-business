import { BadRequestException } from '@nestjs/common';
import { MAX_FOLDER_DEPTH, MAX_NAME_LENGTH } from './project-constants.js';

export function assertRelativePath(value: string): string[] {
  const trimmed = value.trim();

  if (
    !trimmed ||
    trimmed.startsWith('/') ||
    trimmed.includes('\\') ||
    trimmed.split('/').includes('..') ||
    trimmed.split('/').includes('.')
  ) {
    throw new BadRequestException('Invalid input.');
  }

  const segments = trimmed.split('/').filter(Boolean);

  if (segments.length === 0) {
    throw new BadRequestException('Invalid input.');
  }

  if (segments.length - 1 > MAX_FOLDER_DEPTH) {
    throw new BadRequestException('Invalid input.');
  }

  for (const segment of segments) {
    if (segment.length > MAX_NAME_LENGTH) {
      throw new BadRequestException('Invalid input.');
    }
  }

  return segments;
}

export function folderDepthFromParent(
  parentDepth: number,
  extraFolders: number,
): number {
  const depth = parentDepth + extraFolders;

  if (depth > MAX_FOLDER_DEPTH) {
    throw new BadRequestException('Invalid input.');
  }

  return depth;
}
