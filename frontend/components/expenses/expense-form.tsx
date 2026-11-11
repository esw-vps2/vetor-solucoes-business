'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import {
  createExpense,
  getExpense,
  listExpenseAssociations,
  listExpenseCategories,
  updateExpense,
  uploadExpenseDocument,
} from '@/lib/api/client';
import type {
  ExpenseAssociations,
  ExpenseCategoryNode,
  ExpenseDetail,
  ExpenseWriteBody,
  SafeUser,
} from '@/lib/api/client';
import { parseReaisToCents } from '@/lib/finance';
import {
  reaisFromCents,
  validateExpenseForm,
  type ExpenseFormInput,
} from '@/lib/expenses';

const fieldClass =
  'min-h-10 w-full rounded-xl border border-navy/15 bg-white px-3 text-sm text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/20 dark:bg-navy dark:text-white';
const primaryClass =
  'inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';

const emptyForm: ExpenseFormInput = {
  amount: '',
  categoryId: '',
  clientTenantId: '',
  competenceMonth: '',
  count: '',
  description: '',
  dueOn: '',
  expenseType: '',
  interval: 'monthly',
  notes: '',
  paidOn: '',
  paymentMethod: '',
  projectId: '',
  recurring: false,
  scope: '',
  seriesFollows: false,
  startsOn: '',
  status: 'pending',
  subcategoryId: '',
  supplierName: '',
};

export function ExpenseForm({ expenseId, user }: { expenseId?: string; user: SafeUser }) {
  const router = useRouter();
  const [form, setForm] = useState<ExpenseFormInput>(emptyForm);
  const [categories, setCategories] = useState<ExpenseCategoryNode[]>([]);
  const [associations, setAssociations] = useState<ExpenseAssociations>({ projects: [], tenants: [] });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading');

  useEffect(() => {
    if (user.profile !== 'Administrador') {
      return;
    }

    let active = true;
    Promise.all([
      listExpenseCategories(),
      listExpenseAssociations(),
      expenseId ? getExpense(expenseId) : Promise.resolve(null),
    ])
      .then(([nextCategories, nextAssociations, expense]) => {
        if (!active) {
          return;
        }

        setCategories(nextCategories);
        setAssociations(nextAssociations);
        if (expense) {
          setForm(formFromExpense(expense));
        }
        setPhase('ready');
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

  if (phase === 'error') {
    return (
      <div>
        <p>Não foi possível concluir a operação.</p>
        <button
          className={primaryClass}
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

  const category = categories.find((item) => item.id === form.categoryId);
  const subcategories = (category?.subcategories ?? []).filter((item) => item.active);
  const projects = associations.projects.filter(
    (project) => !form.clientTenantId || project.tenantId === form.clientTenantId,
  );
  const seriesEdit = form.scope === 'series';
  const hideOneOffDates = form.recurring || seriesEdit;

  function patch(next: Partial<ExpenseFormInput>) {
    setForm((current) => ({ ...current, ...next }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = validateExpenseForm(form);
    const project = associations.projects.find((item) => item.id === form.projectId);

    if (message) {
      setError(message);
      return;
    }

    if (form.clientTenantId && project && project.tenantId !== form.clientTenantId) {
      setError('Selecione um projeto do cliente informado.');
      return;
    }

    if (!expenseId && category && !category.active) {
      setError('Selecione uma categoria ativa.');
      return;
    }

    if (form.subcategoryId && !subcategories.some((item) => item.id === form.subcategoryId)) {
      setError('Selecione uma subcategoria desta categoria.');
      return;
    }

    const cents = parseReaisToCents(form.amount);

    if (cents == null) {
      setError('Informe um valor válido em reais.');
      return;
    }

    setPhase('saving');
    setError('');

    try {
      const body = writeBody(form, cents);

      if (!expenseId) {
        const created = await createExpense(body);

        if ('generatedCount' in created) {
          router.push(
            `/portal/financeiro/despesas?competence=${form.startsOn.slice(0, 7)}&notice=${encodeURIComponent(
              `Série salva. ${created.generatedCount} lançamentos projetados.`,
            )}`,
          );
          return;
        }

        await uploadFiles(created.id, files, router);
        return;
      }

      const updated = await updateExpense(expenseId, body);
      await uploadFiles(updated.id, files, router);
    } catch {
      setPhase('ready');
      setError('Não foi possível concluir a operação.');
    }
  }

  return (
    <form className="mx-auto flex w-full max-w-[1440px] flex-col gap-4" onSubmit={(event) => void submit(event)}>
      <Link href="/portal/financeiro/despesas">Voltar</Link>
      {error ? <p role="alert">{error}</p> : null}
      {form.seriesFollows ? (
        <fieldset>
          <legend>Aplicar em</legend>
          <label>
            <input
              checked={form.scope === 'occurrence'}
              name="scope"
              type="radio"
              onChange={() => patch({ scope: 'occurrence' })}
            />
            Somente este lançamento
          </label>
          <label>
            <input
              checked={form.scope === 'series'}
              name="scope"
              type="radio"
              onChange={() => patch({ scope: 'series' })}
            />
            Série inteira
          </label>
        </fieldset>
      ) : null}
      <label>
        Descrição
        <input
          aria-required="true"
          className={fieldClass}
          value={form.description}
          onChange={(event) => patch({ description: event.target.value })}
        />
      </label>
      <label>
        Categoria
        <select
          aria-required="true"
          className={fieldClass}
          value={form.categoryId}
          onChange={(event) => patch({ categoryId: event.target.value, subcategoryId: '' })}
        >
          <option value="">Selecione</option>
          {categories
            .filter((item) => item.active || item.id === form.categoryId)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        Valor
        <input
          aria-required="true"
          className={fieldClass}
          value={form.amount}
          onChange={(event) => patch({ amount: event.target.value })}
        />
      </label>
      <label>
        Tipo de despesa
        <select
          aria-required="true"
          className={fieldClass}
          value={form.expenseType}
          onChange={(event) => patch({ expenseType: event.target.value })}
        >
          <option value="">Selecione</option>
          <option value="fixed">Fixa</option>
          <option value="variable">Variável</option>
          <option value="occasional">Eventual</option>
        </select>
      </label>
      <label>
        Subcategoria
        <select
          className={fieldClass}
          value={form.subcategoryId}
          onChange={(event) => patch({ subcategoryId: event.target.value })}
        >
          <option value="">Nenhuma</option>
          {subcategories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Fornecedor
        <input
          className={fieldClass}
          value={form.supplierName}
          onChange={(event) => patch({ supplierName: event.target.value })}
        />
      </label>
      {!expenseId ? (
        <label>
          <input
            checked={form.recurring}
            type="checkbox"
            onChange={(event) => patch({ recurring: event.target.checked })}
          />
          Despesa recorrente
        </label>
      ) : null}
      {form.recurring || form.seriesFollows ? (
        <label>
          Periodicidade
          <select
            className={fieldClass}
            disabled={Boolean(expenseId)}
            value={form.interval}
            onChange={(event) => patch({ interval: event.target.value })}
          >
            <option value="monthly">Mensal</option>
            <option value="yearly">Anual</option>
          </select>
        </label>
      ) : null}
      {form.recurring || seriesEdit ? (
        <>
          <label>
            {form.interval === 'yearly' ? 'Número de anos' : 'Número de meses'}
            <input className={fieldClass} value={form.count} onChange={(event) => patch({ count: event.target.value })} />
          </label>
          <label>
            Data de início do pagamento
            <input
              className={fieldClass}
              type="date"
              value={form.startsOn}
              onChange={(event) => patch({ startsOn: event.target.value })}
            />
          </label>
        </>
      ) : null}
      {hideOneOffDates ? null : (
        <>
          <label>
            Competência
            <input
              aria-required="true"
              className={fieldClass}
              type="month"
              value={form.competenceMonth}
              onChange={(event) => patch({ competenceMonth: event.target.value })}
            />
          </label>
          <label>
            Data de vencimento
            <input
              className={fieldClass}
              type="date"
              value={form.dueOn}
              onChange={(event) => patch({ dueOn: event.target.value })}
            />
          </label>
          <label>
            Status
            <select className={fieldClass} value={form.status} onChange={(event) => patch({ status: event.target.value })}>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              {expenseId ? <option value="cancelled">Cancelado</option> : null}
            </select>
          </label>
          {form.status === 'paid' || (form.status === 'cancelled' && form.paidOn) ? (
            <label>
              Data de pagamento
              <input
                className={fieldClass}
                type="date"
                value={form.paidOn}
                onChange={(event) => patch({ paidOn: event.target.value })}
              />
            </label>
          ) : null}
        </>
      )}
      <label>
        Forma de pagamento
        <input
          className={fieldClass}
          value={form.paymentMethod}
          onChange={(event) => patch({ paymentMethod: event.target.value })}
        />
      </label>
      <label>
        Observações
        <textarea className={fieldClass} value={form.notes} onChange={(event) => patch({ notes: event.target.value })} />
      </label>
      <label>
        Cliente relacionado
        <select
          className={fieldClass}
          value={form.clientTenantId}
          onChange={(event) => patch({ clientTenantId: event.target.value })}
        >
          <option value="">Nenhum</option>
          {associations.tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Projeto relacionado
        <select className={fieldClass} value={form.projectId} onChange={(event) => patch({ projectId: event.target.value })}>
          <option value="">Nenhum</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.tenantName} — {project.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Arquivos
        <input
          type="file"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />
      </label>
      <button className={primaryClass} disabled={phase === 'saving'} type="submit">
        Salvar
      </button>
    </form>
  );
}

function formFromExpense(expense: ExpenseDetail): ExpenseFormInput {
  return {
    ...emptyForm,
    amount: reaisFromCents(expense.amountCents),
    categoryId: expense.categoryId,
    clientTenantId: expense.clientTenantId ?? '',
    competenceMonth: expense.competenceMonth,
    description: expense.description,
    dueOn: expense.dueOn ?? '',
    expenseType: expense.expenseType,
    interval: expense.recurrence ?? 'monthly',
    notes: expense.notes ?? '',
    paidOn: expense.paidOn ?? '',
    paymentMethod: expense.paymentMethod ?? '',
    projectId: expense.projectId ?? '',
    seriesFollows: Boolean(expense.seriesId) && !expense.seriesDetached,
    status: expense.status,
    subcategoryId: expense.subcategoryId ?? '',
    supplierName: expense.supplierName ?? '',
  };
}

function writeBody(form: ExpenseFormInput, cents: number): ExpenseWriteBody {
  const shared: ExpenseWriteBody = {
    amountCents: cents,
    categoryId: form.categoryId,
    clientTenantId: form.clientTenantId || null,
    description: form.description.trim(),
    expenseType: form.expenseType,
    notes: form.notes.trim() || null,
    paymentMethod: form.paymentMethod.trim() || null,
    projectId: form.projectId || null,
    subcategoryId: form.subcategoryId || null,
    supplierName: form.supplierName.trim() || null,
  };

  if (form.recurring) {
    return {
      ...shared,
      recurrence: {
        count: Number(form.count),
        interval: form.interval,
        startsOn: form.startsOn,
      },
    };
  }

  if (form.scope === 'series') {
    return {
      ...shared,
      scope: 'series',
      ...(form.count.trim() ? { count: Number(form.count) } : {}),
      ...(form.startsOn ? { startsOn: form.startsOn } : {}),
    };
  }

  return {
    ...shared,
    competenceMonth: form.competenceMonth,
    dueOn: form.dueOn || null,
    status: form.status,
    ...(form.scope === 'occurrence' ? { scope: 'occurrence' } : {}),
    ...(form.status === 'paid' ? { paidOn: form.paidOn } : {}),
  };
}

async function uploadFiles(
  expenseId: string,
  files: File[],
  router: { push: (href: string) => void },
) {
  for (const file of files) {
    try {
      await uploadExpenseDocument(expenseId, file);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
      router.push(`/portal/financeiro/despesas/${expenseId}?notice=${encodeURIComponent(message)}`);
      return;
    }
  }

  router.push(`/portal/financeiro/despesas/${expenseId}?notice=${encodeURIComponent('Despesa salva.')}`);
}
