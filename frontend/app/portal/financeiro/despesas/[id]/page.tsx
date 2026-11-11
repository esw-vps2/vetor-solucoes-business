'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ExpenseDetailView } from '@/components/expenses/expense-detail';
import { PortalPageFrame } from '@/components/layout/portal-page-frame';
import type { SafeUser } from '@/lib/api/client';

export default function PortalExpensePage() {
  const params = useParams<{ id: string }>();
  const expenseId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <PortalPageFrame pageTitle="Custos e Despesas">
      {(session) => (
        <Suspense fallback={<p>Carregando...</p>}>
          <ExpenseRoute expenseId={expenseId} user={session.user} />
        </Suspense>
      )}
    </PortalPageFrame>
  );
}

function ExpenseRoute({ expenseId, user }: { expenseId: string; user: SafeUser }) {
  const params = useSearchParams();

  return (
    <ExpenseDetailView
      expenseId={expenseId}
      notice={params.get('notice') ?? undefined}
      user={user}
    />
  );
}
