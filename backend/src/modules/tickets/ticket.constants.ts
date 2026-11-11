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

export const TICKET_PRIORITIES = ['low', 'medium', 'high'] as const;

export const DEFAULT_TICKET_PRIORITY = 'low';

export const INITIAL_TICKET_STATUS = 'aberto';

export const TICKET_SUCCESS_MESSAGE = 'Operação realizada com sucesso.';

export const DEFAULT_TICKET_PAGE = 1;

export const DEFAULT_TICKET_LIMIT = 20;

export const MAX_TICKET_LIMIT = 100;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export type TicketStatus = (typeof TICKET_STATUSES)[number];
