'use client';

import { ExpenseForm } from '@/components/expenses/expense-form';
import { PortalPageFrame } from '@/components/layout/portal-page-frame';

export default function PortalNewExpensePage() {
  return (
    <PortalPageFrame pageTitle="Custos e Despesas">
      {(session) => <ExpenseForm user={session.user} />}
    </PortalPageFrame>
  );
}
