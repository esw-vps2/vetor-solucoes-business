import type { ExpenseStatus } from './expense.constants.js';

export function resolveCreateStatus(
  status: 'pending' | 'paid' | undefined,
  paidOn: string | null | undefined,
): { paidOn: string | null; status: 'pending' | 'paid' } | null {
  const next = status ?? 'pending';

  if (next === 'pending') {
    return paidOn ? null : { paidOn: null, status: 'pending' };
  }

  return paidOn ? { paidOn, status: 'paid' } : null;
}

export function resolveStatus(
  current: { paidOn: string | null; status: ExpenseStatus },
  patch: { paidOn?: string | null; status?: ExpenseStatus },
): { paidOn: string | null; status: ExpenseStatus } | null {
  if (patch.status === undefined && patch.paidOn === undefined) {
    return { paidOn: current.paidOn, status: current.status };
  }

  const status = patch.status ?? current.status;

  if (status === 'pending') {
    return patch.paidOn ? null : { paidOn: null, status };
  }

  if (status === 'paid') {
    const paidOn = patch.paidOn === undefined ? current.paidOn : patch.paidOn;
    return paidOn ? { paidOn, status } : null;
  }

  if (patch.paidOn !== undefined && patch.paidOn !== current.paidOn) {
    return null;
  }

  return { paidOn: current.paidOn, status: 'cancelled' };
}
