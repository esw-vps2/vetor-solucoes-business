'use client';

import { useParams } from 'next/navigation';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { PortalPageFrame } from '@/components/layout/portal-page-frame';

export default function PortalEditExpensePage() {
  const params = useParams<{ id: string }>();
  const expenseId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <PortalPageFrame pageTitle="Custos e Despesas">
      {(session) => <ExpenseForm expenseId={expenseId} user={session.user} />}
    </PortalPageFrame>
  );
}
