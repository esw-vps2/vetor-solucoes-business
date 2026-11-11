export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isCompetenceMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function competenceDate(month: string): string {
  return `${month}-01`;
}

export function monthKey(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.slice(0, 7);
}

export function currentCompetenceMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
  }).formatToParts(now);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;

  return `${year}-${month}`;
}

export function addMonthsClamped(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const absolute = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(absolute / 12);
  const targetMonth = absolute % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDay);

  return [
    String(targetYear).padStart(4, '0'),
    String(targetMonth + 1).padStart(2, '0'),
    String(clampedDay).padStart(2, '0'),
  ].join('-');
}

export function occurrenceDueDate(
  startsOn: string,
  interval: 'monthly' | 'yearly',
  index: number,
): string {
  return addMonthsClamped(startsOn, interval === 'yearly' ? index * 12 : index);
}

export function temporaryCompetence(seriesIndex: number): string {
  return addMonthsClamped('2400-01-01', seriesIndex);
}
