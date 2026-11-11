import { CARD_PRIORITIES } from '@/lib/project-kanban';

const PASTE_IMAGE_EXTENSION: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const TICKET_CATEGORIES = [
  'duvida',
  'suporte_tecnico',
  'erro_falha',
  'solicitacao_servico',
  'financeiro_cobranca',
  'melhoria',
  'outros',
] as const;

export const TICKET_STATUSES = [
  'aberto',
  'em_andamento',
  'em_analise',
  'resolvido',
  'cancelado',
] as const;

const categoryLabels: Record<(typeof TICKET_CATEGORIES)[number], string> = {
  duvida: 'Dúvida',
  erro_falha: 'Erro/falha',
  financeiro_cobranca: 'Financeiro/cobrança',
  melhoria: 'Melhoria',
  outros: 'Outros',
  solicitacao_servico: 'Solicitação de serviço',
  suporte_tecnico: 'Suporte técnico',
};

const statusLabels: Record<(typeof TICKET_STATUSES)[number], string> = {
  aberto: 'Aberto',
  cancelado: 'Cancelado',
  em_analise: 'Em análise',
  em_andamento: 'Em andamento',
  resolvido: 'Resolvido',
};

export function ticketCategoryLabel(value: string): string {
  return categoryLabels[value as (typeof TICKET_CATEGORIES)[number]] ?? value;
}

export function ticketStatusLabel(value: string): string {
  return statusLabels[value as (typeof TICKET_STATUSES)[number]] ?? value;
}

export function formatTicketDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}

export function ticketFeedback(status: number): string {
  if (status === 403) {
    return 'Você não tem permissão para esta ação.';
  }

  if (status === 404) {
    return 'Este registro não existe.';
  }

  return 'Não foi possível concluir a operação.';
}

export function isTicketCompany(profile: string): boolean {
  return profile === 'Administrador';
}

export const DEFAULT_TICKET_PRIORITY = 'low';

export function ticketPriorityPresentation(value: string): (typeof CARD_PRIORITIES)[number] {
  return CARD_PRIORITIES.find((item) => item.key === value) ?? CARD_PRIORITIES[0];
}

interface ClipboardFileSource {
  files?: ArrayLike<File> | null;
  items?: ArrayLike<{
    getAsFile: () => File | null;
    kind: string;
    type: string;
  }> | null;
}

export function imageFilesFromClipboard(data: ClipboardFileSource | null): File[] {
  if (!data) {
    return [];
  }

  const items = data.items ? Array.from(data.items) : [];
  const fileItems = items.filter((item) => item.kind === 'file');

  if (fileItems.length > 0) {
    return fileItems.flatMap((item) => {
      const file = item.getAsFile();
      return file && PASTE_IMAGE_EXTENSION[file.type] ? [namedPasteImage(file)] : [];
    });
  }

  if (!data.files) {
    return [];
  }

  return Array.from(data.files).flatMap((file) =>
    PASTE_IMAGE_EXTENSION[file.type] ? [namedPasteImage(file)] : [],
  );
}

function namedPasteImage(file: File): File {
  if (file.name.trim()) {
    return file;
  }

  return new File([file], `imagem.${PASTE_IMAGE_EXTENSION[file.type]}`, {
    lastModified: file.lastModified,
    type: file.type,
  });
}
