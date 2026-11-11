export const KANBAN_LANES = [
  'backlog',
  'ready',
  'working',
  'review',
  'deploy',
  'done',
] as const;

export type KanbanLane = (typeof KANBAN_LANES)[number];

export const CARD_PRIORITIES = ['low', 'medium', 'high'] as const;

export type CardPriority = (typeof CARD_PRIORITIES)[number];

export const DEFAULT_CARD_PRIORITY: CardPriority = 'medium';

export const DEFAULT_CARD_LANE: KanbanLane = 'backlog';

export const TAG_COLORS = [
  'lime',
  'sky',
  'pink',
  'amber',
  'violet',
  'teal',
  'coral',
  'navy',
] as const;

export type TagColor = (typeof TAG_COLORS)[number];

export interface CardTag {
  color: TagColor;
  name: string;
}

export const MAX_NAME_LENGTH = 120;

export const MAX_TITLE_LENGTH = 120;

export const MAX_DESCRIPTION_LENGTH = 10000;

export const MAX_TAGS_PER_CARD = 20;

export const MAX_TAG_LENGTH = 40;

export const MAX_ATTACHMENTS_PER_CARD = 10;

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const MAX_PROJECT_TREE_BYTES = 500 * 1024 * 1024;

export const MAX_PROJECT_DOCUMENT_NODES = 200;

export const MAX_FOLDER_DEPTH = 8;

export const MAX_BACKGROUND_BYTES = 8 * 1024 * 1024;

export const MAX_COMMENT_BODY_LENGTH = 4000;

export const MAX_COMMENTS_PER_CARD = 500;

export const MAX_CHECKLIST_ITEMS_PER_CARD = 50;

export const MAX_CHECKLIST_BODY_LENGTH = 200;

export const ATTACHMENT_MIME_TO_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'text/markdown': 'md',
  'application/json': 'json',
  'application/zip': 'zip',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'pptx',
} as const;

export type AttachmentMime = keyof typeof ATTACHMENT_MIME_TO_EXTENSION;

export const IMAGE_ATTACHMENT_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export type ImageAttachmentMime = (typeof IMAGE_ATTACHMENT_MIMES)[number];

export const BACKGROUND_MIME_TO_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export type BackgroundMime = keyof typeof BACKGROUND_MIME_TO_EXTENSION;

export function isAttachmentMime(value: string): value is AttachmentMime {
  return value in ATTACHMENT_MIME_TO_EXTENSION;
}

export function isBackgroundMime(value: string): value is BackgroundMime {
  return value in BACKGROUND_MIME_TO_EXTENSION;
}

export function isImageAttachmentMime(
  value: string,
): value is ImageAttachmentMime {
  return IMAGE_ATTACHMENT_MIMES.includes(value as ImageAttachmentMime);
}

export function tagColorFromName(name: string): TagColor {
  let hash = 0;

  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }

  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function isCardTag(value: unknown): value is CardTag {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as { color?: unknown; name?: unknown };
  return (
    typeof record.name === 'string' &&
    TAG_COLORS.includes(record.color as TagColor)
  );
}
