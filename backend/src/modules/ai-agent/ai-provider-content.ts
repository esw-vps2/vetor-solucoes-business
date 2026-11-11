import type { ProviderContentPart, ProviderMessage } from './ai-agent.types.js';

const MAX_EMBEDDED_TEXT_CHARS = 120_000;

export interface ResolvedAiAttachment {
  bytes: Buffer;
  mimeType: string;
  originalName: string;
}

export function selectProviderModel(
  messages: ProviderMessage[],
  textModel: string,
  visionModel: string,
): string {
  const hasImage = messages.some(
    (message) =>
      Array.isArray(message.content) &&
      message.content.some((part) => part.type === 'image_url'),
  );

  return hasImage ? visionModel : textModel;
}

export function buildUserProviderContent(
  text: string,
  attachments: ResolvedAiAttachment[],
): string | ProviderContentPart[] {
  if (attachments.length === 0) {
    return text;
  }

  const parts: ProviderContentPart[] = [];

  if (text.trim().length > 0) {
    parts.push({ text, type: 'text' });
  }

  for (const attachment of attachments) {
    parts.push(...partsForAttachment(attachment));
  }

  if (parts.length === 0) {
    return text;
  }

  return parts.length === 1 && parts[0]?.type === 'text' ? parts[0].text : parts;
}

function partsForAttachment(
  attachment: ResolvedAiAttachment,
): ProviderContentPart[] {
  const mime = attachment.mimeType.toLowerCase();

  if (mime.startsWith('image/')) {
    const encoded = attachment.bytes.toString('base64');
    return [
      {
        image_url: { url: `data:${mime};base64,${encoded}` },
        type: 'image_url',
      },
    ];
  }

  const decoded = decodeTextPayload(attachment.bytes, mime);
  const body = decoded.slice(0, MAX_EMBEDDED_TEXT_CHARS);
  const suffix =
    decoded.length > MAX_EMBEDDED_TEXT_CHARS ? '\n[conteúdo truncado]' : '';

  return [
    {
      text: `[Arquivo anexado: ${attachment.originalName} (${mime})]\n${body}${suffix}`,
      type: 'text',
    },
  ];
}

function decodeTextPayload(bytes: Buffer, mime: string): string {
  if (mime.startsWith('text/') || mime === 'application/json') {
    return bytes.toString('utf8');
  }

  return bytes.toString('base64');
}
