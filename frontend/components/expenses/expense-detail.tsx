'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import {
  cancelExpense,
  cancelExpenseSeries,
  deleteExpenseDocument,
  downloadExpenseDocument,
  getExpense,
} from '@/lib/api/client';
import type { ExpenseDetail, SafeUser } from '@/lib/api/client';
import {
  competenceLabel,
  expenseStatusLabel,
  expenseTypeLabel,
  formatCentsBRL,
  formatIsoDate,
  recurrenceLabel,
} from '@/lib/expenses';

const primaryClass =
  'inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';
const secondaryClass =
  'inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-navy/15 bg-white px-4 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/20 dark:bg-transparent dark:text-white';
const modalSecondaryClass =
  'inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-navy/15 bg-white px-4 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';

export function ExpenseDetailView({
  expenseId,
  notice,
  user,
}: {
  expenseId: string;
  notice?: string;
  user: SafeUser;
}) {
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [banner, setBanner] = useState(notice ?? '');
  const [cancelKind, setCancelKind] = useState<'one' | 'series' | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (user.profile !== 'Administrador') {
      return;
    }

    let active = true;
    getExpense(expenseId)
      .then((next) => {
        if (active) {
          setExpense(next);
          setPhase('ready');
        }
      })
      .catch(() => {
        if (active) {
          setPhase('error');
        }
      });

    return () => {
      active = false;
    };
  }, [attempt, expenseId, user.profile]);

  if (user.profile !== 'Administrador') {
    return <p>Você não tem acesso ao financeiro.</p>;
  }

  if (phase === 'loading') {
    return <p>Carregando...</p>;
  }

  if (phase === 'error' || !expense) {
    return (
      <div>
        <p>Não foi possível concluir a operação.</p>
        <button
          className={secondaryClass}
          type="button"
          onClick={() => {
            setPhase('loading');
            setAttempt((current) => current + 1);
          }}
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4">
      <Link href="/portal/financeiro/despesas">Voltar</Link>
      {banner ? <p role="status">{banner}</p> : null}
      {expense.seriesDetached ? <p>Este lançamento foi desvinculado da série.</p> : null}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Descrição" value={expense.description} />
        <Field label="Categoria" value={expense.categoryName} />
        <Field label="Valor" value={formatCentsBRL(expense.amountCents)} />
        <Field label="Competência" value={competenceLabel(expense.competenceMonth)} />
        <Field label="Tipo de despesa" value={expenseTypeLabel(expense.expenseType)} />
        <Field label="Subcategoria" value={expense.subcategoryName || '—'} />
        <Field label="Fornecedor" value={expense.supplierName || '—'} />
        <Field label="Data de vencimento" value={formatIsoDate(expense.dueOn)} />
        <Field label="Status" value={expenseStatusLabel(expense.status)} />
        <Field label="Data de pagamento" value={formatIsoDate(expense.paidOn)} />
        <Field label="Forma de pagamento" value={expense.paymentMethod || '—'} />
        <Field label="Observações" value={expense.notes || '—'} />
        <Field label="Cliente relacionado" value={expense.clientTenantName || '—'} />
        <Field label="Projeto relacionado" value={expense.projectName || '—'} />
        <Field label="Recorrência" value={recurrenceLabel(expense.recurrence)} />
      </dl>
      <div className="flex flex-wrap gap-2">
        <Link className={primaryClass} href={`/portal/financeiro/despesas/${expense.id}/editar`}>
          Editar
        </Link>
        {expense.status !== 'cancelled' ? (
          <button className={secondaryClass} type="button" onClick={() => setCancelKind('one')}>
            Cancelar lançamento
          </button>
        ) : null}
        {expense.seriesId && expense.status !== 'cancelled' ? (
          <button className={secondaryClass} type="button" onClick={() => setCancelKind('series')}>
            Cancelar série
          </button>
        ) : null}
      </div>
      <ul>
        {expense.documents.map((document) => (
          <li key={document.id}>
            {document.originalName}
            <button
              type="button"
              onClick={() => void downloadExpenseDocument(expense.id, document.id, document.originalName)}
            >
              Baixar
            </button>
            <button
              type="button"
              onClick={() =>
                void deleteExpenseDocument(expense.id, document.id).then(() => {
                  setExpense((current) =>
                    current
                      ? { ...current, documents: current.documents.filter((item) => item.id !== document.id) }
                      : current,
                  );
                })
              }
            >
              Remover
            </button>
          </li>
        ))}
      </ul>
      <Modal labelledBy="cancel-detail-title" open={cancelKind !== null} onClose={() => setCancelKind(null)} tone="light">
        <div className="flex flex-col gap-4 text-navy">
          <h2 id="cancel-detail-title" className="pr-10 text-2xl font-semibold text-navy">
            {cancelKind === 'series' ? 'Cancelar série' : 'Cancelar lançamento'}
          </h2>
          <p className="text-sm leading-7 text-text-dark-secondary">
            {cancelKind === 'series'
              ? 'Todos os lançamentos desta série permanecem no histórico e deixam de entrar nos indicadores.'
              : 'O lançamento permanece no histórico e deixa de entrar nos indicadores.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className={primaryClass}
              type="button"
              onClick={() => {
                const action =
                  cancelKind === 'series' && expense.seriesId
                    ? cancelExpenseSeries(expense.seriesId).then(() => getExpense(expense.id))
                    : cancelExpense(expense.id);
                void action.then((next) => {
                  setExpense(next);
                  setBanner(cancelKind === 'series' ? 'Série cancelada.' : 'Despesa cancelada.');
                  setCancelKind(null);
                });
              }}
            >
              {cancelKind === 'series' ? 'Cancelar série' : 'Cancelar lançamento'}
            </button>
            <button className={modalSecondaryClass} type="button" onClick={() => setCancelKind(null)}>
              Voltar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
