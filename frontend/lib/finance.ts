export function saoPauloCalendarDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
  }).format(now);
}

export function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function formatCentsBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(cents / 100);
}

export function parseReaisToCents(input: string): number | null {
  const trimmed = input.trim();

  if (!/^\d{1,11}(,\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  const [whole, fraction = ''] = trimmed.split(',');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));

  if (!Number.isSafeInteger(cents) || cents > 99999999999) {
    return null;
  }

  return cents;
}

export const MAX_INSTALLMENTS = 120;

export function parseInstallmentCount(value: string): number | null {
  if (!/^\d{1,3}$/.test(value.trim())) {
    return null;
  }

  const count = Number(value);
  return count >= 1 && count <= MAX_INSTALLMENTS ? count : null;
}

export const CONTRACT_STATUS_OPTIONS = [
  { label: 'Rascunho', value: 'draft' },
  { label: 'Vigente', value: 'active' },
  { label: 'Encerrado', value: 'closed' },
  { label: 'Cancelado', value: 'cancelled' },
] as const;

export const COST_CATEGORY_OPTIONS = [
  { label: 'Equipe', value: 'team' },
  { label: 'Terceiro', value: 'third_party' },
  { label: 'Infraestrutura', value: 'infrastructure' },
  { label: 'Outro', value: 'other' },
] as const;

export function contractStatusLabel(status: string | null | undefined): string {
  return CONTRACT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'Sem contrato';
}

export function costCategoryLabel(category: string): string {
  return COST_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category;
}
