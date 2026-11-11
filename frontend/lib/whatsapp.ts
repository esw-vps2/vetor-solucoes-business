export const WHATSAPP_READY_SPEECH = 'Estou pronto para lhe atender.';

const CLICK_TO_CHAT_ORIGIN = 'https://wa.me';

export function buildWhatsAppClickToChatUrl(rawNumber: string | undefined): string | null {
  const configuredNumber = rawNumber?.trim() ?? '';

  if (configuredNumber === '') {
    return null;
  }

  if (/[a-z./:]/i.test(configuredNumber)) {
    return null;
  }

  const digits = configuredNumber.replace(/\D/g, '');

  if (digits === '') {
    return null;
  }

  return `${CLICK_TO_CHAT_ORIGIN}/${digits}`;
}
