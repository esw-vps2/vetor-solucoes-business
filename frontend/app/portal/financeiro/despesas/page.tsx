'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ExpensesHome } from '@/components/expenses/expenses-home';
import { PortalPageFrame } from '@/components/layout/portal-page-frame';
import type { SafeUser } from '@/lib/api/client';

export default function PortalExpensesPage() {
  return (
    <PortalPageFrame pageTitle="Custos e Despesas">
      {(session) => (
        <Suspense fallback={<p>Carregando...</p>}>
          <ExpensesRoute user={session.user} />
        </Suspense>
      )}
    </PortalPageFrame>
  );
}

function ExpensesRoute({ user }: { user: SafeUser }) {
  const params = useSearchParams();

  return (
    <ExpensesHome
      initialCompetence={params.get('competence') ?? undefined}
      notice={params.get('notice') ?? undefined}
      user={user}
    />
  );
}
