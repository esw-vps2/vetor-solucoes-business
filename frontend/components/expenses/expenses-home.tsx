'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal } from '@/components/ui/modal';
import {
  cancelExpense,
  cancelExpenseSeries,
  cancelExpenses,
  createExpenseCategory,
  createExpenseSubcategory,
  deleteExpenseCategory,
  deleteExpenseSubcategory,
  listExpenseAssociations,
  listExpenseCategories,
  listExpenses,
  updateExpenseCategory,
  updateExpenseSubcategory,
} from '@/lib/api/client';
import type {
  ExpenseAssociations,
  ExpenseCategoryNode,
  ExpenseItem,
  ExpenseList,
  SafeUser,
} from '@/lib/api/client';
import {
  competenceLabel,
  competenceShort,
  defaultExpenseFilters,
  expenseMonthOptions,
  expenseQueryString,
  expenseStatusLabel,
  filtersAreDefault,
  formatCentsBRL,
  formatIsoDate,
  recurrenceLabel,
  type ExpenseFilters,
  type ExpenseSort,
} from '@/lib/expenses';

const fieldClass =
  'min-h-10 w-full rounded-xl border border-navy/15 bg-white px-3 text-sm text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/20 dark:bg-navy dark:text-white';
const selectClass =
  'w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium text-navy focus-visible:outline-none dark:text-white';
const primaryClass =
  'inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';
const secondaryClass =
  'inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-navy/10 bg-white px-4 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/20 dark:bg-transparent dark:text-white';
const pageClass =
  'inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-navy/10 bg-white text-sm font-medium text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:bg-transparent dark:text-white';

const columns: Array<{ label: string; sort: ExpenseSort }> = [
  { label: 'Descrição', sort: 'description' },
  { label: 'Categoria', sort: 'category' },
  { label: 'Fornecedor', sort: 'supplier' },
  { label: 'Competência', sort: 'competence' },
  { label: 'Vencimento', sort: 'dueOn' },
  { label: 'Valor', sort: 'amount' },
  { label: 'Status', sort: 'status' },
  { label: 'Recorrência', sort: 'recurrence' },
];

export function ExpensesHome({
  initialCompetence,
  notice,
  user,
}: {
  initialCompetence?: string;
  notice?: string;
  user: SafeUser;
}) {
  const [filters, setFilters] = useState<ExpenseFilters>(() => ({
    ...defaultExpenseFilters(),
    competence: initialCompetence || defaultExpenseFilters().competence,
  }));
  const [phase, setPhase] = useState<'loading' | 'error' | 'ready'>('loading');
  const [list, setList] = useState<ExpenseList | null>(null);
  const [categories, setCategories] = useState<ExpenseCategoryNode[]>([]);
  const [associations, setAssociations] = useState<ExpenseAssociations>({ projects: [], tenants: [] });
  const [selected, setSelected] = useState<string[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<
    { kind: 'one'; id: string } | { kind: 'many' } | { kind: 'series'; id: string } | null
  >(null);
  const [banner, setBanner] = useState(notice ?? '');
  const [reloadKey, setReloadKey] = useState(0);
  const [moreFilters, setMoreFilters] = useState(false);

  useEffect(() => {
    if (user.profile !== 'Administrador') {
      return;
    }

    let active = true;
    Promise.all([
      listExpenses(expenseQueryString(filters)),
      listExpenseCategories(),
      listExpenseAssociations(),
    ])
      .then(([nextList, nextCategories, nextAssociations]) => {
        if (!active) {
          return;
        }

        setList(nextList);
        setCategories(nextCategories);
        setAssociations(nextAssociations);
        setPhase('ready');
      })
      .catch(() => {
        if (active) {
          setList(null);
          setPhase('error');
        }
      });

    return () => {
      active = false;
    };
  }, [filters, reloadKey, user.profile]);

  if (user.profile !== 'Administrador') {
    return <p>Você não tem acesso ao financeiro.</p>;
  }

  const subcategories =
    categories.find((category) => category.id === filters.categoryId)?.subcategories ??
    categories.flatMap((category) => category.subcategories);
  const pageItems = list?.items ?? [];
  const allSelected = pageItems.length > 0 && pageItems.every((item) => selected.includes(item.id));

  function replaceFilters(next: ExpenseFilters | ((current: ExpenseFilters) => ExpenseFilters)) {
    setSelected([]);
    setPhase('loading');
    setFilters(next);
  }

  function updateFilters(patch: Partial<ExpenseFilters>) {
    replaceFilters((current) => ({ ...current, page: 1, ...patch }));
  }

  async function confirmCancel() {
    if (!cancelTarget) {
      return;
    }

    if (cancelTarget.kind === 'one') {
      await cancelExpense(cancelTarget.id);
      setBanner('Despesa cancelada.');
    } else if (cancelTarget.kind === 'many') {
      await cancelExpenses(selected);
      setBanner('Lançamentos cancelados.');
    } else {
      await cancelExpenseSeries(cancelTarget.id);
      setBanner('Série cancelada.');
    }

    setCancelTarget(null);
    setReloadKey((current) => current + 1);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      {banner ? (
        <p className="text-sm font-medium text-navy dark:text-white" role="status">
          {banner}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
          <FilterCard icon={<CalendarIcon />} label="Período">
            <select
              className={selectClass}
              value={filters.competence}
              onChange={(event) => updateFilters({ competence: event.target.value })}
            >
              {expenseMonthOptions().map((month) => (
                <option key={month} value={month}>
                  {competenceLabel(month)}
                </option>
              ))}
            </select>
          </FilterCard>
          <FilterCard label="Categoria">
            <select
              className={selectClass}
              value={filters.categoryId}
              onChange={(event) => updateFilters({ categoryId: event.target.value, subcategoryId: '' })}
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FilterCard>
          <FilterCard label="Status">
            <select
              className={selectClass}
              value={filters.status}
              onChange={(event) => updateFilters({ status: event.target.value as ExpenseFilters['status'] })}
            >
              <option value="">Todos</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </FilterCard>
        </div>
        <Link className={`${primaryClass} shrink-0`} href="/portal/financeiro/despesas/nova">
          <PlusIcon />
          Nova despesa
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-navy/55 dark:text-white/60">Competência: {competenceLabel(filters.competence)}</p>
        <div className="flex flex-wrap gap-2">
          <button
            aria-expanded={moreFilters}
            className={secondaryClass}
            type="button"
            onClick={() => setMoreFilters((current) => !current)}
          >
            Mais filtros
          </button>
          <button className={secondaryClass} type="button" onClick={() => replaceFilters(defaultExpenseFilters())}>
            Limpar filtros
          </button>
          <button className={secondaryClass} type="button" onClick={() => setCategoriesOpen(true)}>
            Categorias
          </button>
        </div>
      </div>
      {moreFilters ? (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FilterCard label="Subcategoria">
          <select
            className={selectClass}
            value={filters.subcategoryId}
            onChange={(event) => updateFilters({ subcategoryId: event.target.value })}
          >
            <option value="">Todas</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </FilterCard>
        <FilterCard label="Fornecedor" trailing={false}>
          <input
            className="w-full bg-transparent text-sm font-medium text-navy focus-visible:outline-none dark:text-white"
            value={filters.supplier}
            onChange={(event) => updateFilters({ supplier: event.target.value })}
          />
        </FilterCard>
        <FilterCard label="Tipo">
          <select
            className={selectClass}
            value={filters.type}
            onChange={(event) => updateFilters({ type: event.target.value as ExpenseFilters['type'] })}
          >
            <option value="">Todos</option>
            <option value="fixed">Fixa</option>
            <option value="variable">Variável</option>
            <option value="occasional">Eventual</option>
          </select>
        </FilterCard>
        <FilterCard label="Projeto">
          <select
            className={selectClass}
            value={filters.projectId}
            onChange={(event) => updateFilters({ projectId: event.target.value })}
          >
            <option value="">Todos</option>
            {associations.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.tenantName} — {project.name}
              </option>
            ))}
          </select>
        </FilterCard>
      </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<DocumentIcon />}
          label="Despesas do mês"
          value={phase === 'ready' ? formatCentsBRL(list?.summary.periodTotalCents ?? 0) : ''}
        />
        <SummaryCard
          caption="Data de pagamento"
          icon={<CheckIcon />}
          label="Pagas"
          value={phase === 'ready' ? formatCentsBRL(list?.summary.paidTotalCents ?? 0) : ''}
        />
        <SummaryCard
          icon={<ClockIcon />}
          label="Pendentes"
          value={phase === 'ready' ? formatCentsBRL(list?.summary.pendingTotalCents ?? 0) : ''}
        />
        <SummaryCard
          icon={<ListIcon />}
          label="Lançamentos"
          value={phase === 'ready' ? String(list?.summary.count ?? 0) : ''}
        />
      </div>
      <section className="rounded-2xl border border-navy/10 bg-white p-5 dark:border-white/10 dark:bg-navy">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-navy dark:text-white">Lançamentos recentes</h2>
          <label className="relative block sm:w-72">
            <span className="sr-only">Buscar lançamentos</span>
            <SearchIcon />
            <input
              className="h-10 w-full rounded-full border border-navy/10 bg-off-white pr-4 pl-10 text-sm text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/15 dark:bg-navy-100 dark:text-white"
              placeholder="Buscar lançamentos..."
              value={filters.q}
              onChange={(event) => updateFilters({ q: event.target.value })}
            />
          </label>
        </div>
        {phase === 'loading' ? <p>Carregando...</p> : null}
        {phase === 'error' ? (
          <div>
            <p>Não foi possível concluir a operação.</p>
            <button className={secondaryClass} type="button" onClick={() => {
              setPhase('loading');
              setReloadKey((current) => current + 1);
            }}>
              Tentar de novo
            </button>
          </div>
        ) : null}
        {phase === 'ready' && list && list.total === 0 ? (
          <p>
            {filtersAreDefault(filters)
              ? 'Nenhuma despesa cadastrada. Use Nova despesa para registrar a primeira.'
              : 'Nenhum lançamento para os filtros selecionados.'}
          </p>
        ) : null}
        {phase === 'ready' && list && list.total > 0 ? (
          <>
            {selected.length > 0 ? (
              <button className={secondaryClass} type="button" onClick={() => setCancelTarget({ kind: 'many' })}>
                Cancelar selecionados
              </button>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="bg-off-white text-xs font-semibold tracking-wide text-navy/45 uppercase dark:bg-white/5 dark:text-white/45">
                    <th className="border-b border-navy/10 px-3 py-3 dark:border-white/10">
                      <input
                        aria-label="Selecionar"
                        checked={allSelected}
                        type="checkbox"
                        onChange={() =>
                          setSelected(allSelected ? [] : pageItems.map((item) => item.id))
                        }
                      />
                    </th>
                    {columns.map((column) => (
                      <th
                        aria-sort={ariaSort(filters, column.sort)}
                        className="border-b border-navy/10 px-3 py-3 dark:border-white/10"
                        key={column.sort}
                      >
                        <button
                          className="cursor-pointer uppercase focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                          type="button"
                          onClick={() => toggleSort(replaceFilters, column.sort)}
                        >
                          {column.label}
                        </button>
                      </th>
                    ))}
                    <th className="border-b border-navy/10 px-3 py-3 text-right dark:border-white/10">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => (
                    <ExpenseRow
                      item={item}
                      key={item.id}
                      menuOpen={menuId === item.id}
                      selected={selected.includes(item.id)}
                      onCancel={() => setCancelTarget({ kind: 'one', id: item.id })}
                      onCancelSeries={() => item.seriesId && setCancelTarget({ kind: 'series', id: item.seriesId })}
                      onSelect={(checked) =>
                        setSelected((current) =>
                          checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                        )
                      }
                      onToggleMenu={() => setMenuId((current) => (current === item.id ? null : item.id))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-navy/50 dark:text-white/50">
                Mostrando {(list.page - 1) * list.limit + 1} a {Math.min(list.page * list.limit, list.total)} de{' '}
                {list.total} lançamentos
              </p>
              <div className="flex items-center gap-1">
                <button
                  aria-label="Página anterior"
                  className={pageClass}
                  disabled={list.page <= 1}
                  type="button"
                  onClick={() => updateFilters({ page: list.page - 1 })}
                >
                  <ChevronIcon direction="left" />
                </button>
                {Array.from({ length: Math.ceil(list.total / list.limit) }, (_, index) => index + 1).map((page) => (
                  <button
                    className={page === list.page ? `${pageClass} border-transparent bg-accent font-semibold` : pageClass}
                    key={page}
                    type="button"
                    onClick={() => updateFilters({ page })}
                  >
                    {page}
                  </button>
                ))}
                <button
                  aria-label="Próxima página"
                  className={pageClass}
                  disabled={list.page * list.limit >= list.total}
                  type="button"
                  onClick={() => updateFilters({ page: list.page + 1 })}
                >
                  <ChevronIcon direction="right" />
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>
      <ExpenseCategoriesDialog
        categories={categories}
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        onSaved={(next) => {
          setCategories(next);
          setBanner('Categoria salva.');
        }}
      />
      <Modal labelledBy="cancel-expense-title" open={cancelTarget !== null} onClose={() => setCancelTarget(null)} tone="light">
        <h2 id="cancel-expense-title">
          {cancelTarget?.kind === 'series'
            ? 'Cancelar série'
            : cancelTarget?.kind === 'many'
              ? 'Cancelar lançamentos'
              : 'Cancelar lançamento'}
        </h2>
        <p>
          {cancelTarget?.kind === 'series'
            ? 'Todos os lançamentos desta série permanecem no histórico e deixam de entrar nos indicadores.'
            : cancelTarget?.kind === 'many'
              ? 'Os lançamentos selecionados permanecem no histórico e deixam de entrar nos indicadores.'
              : 'O lançamento permanece no histórico e deixa de entrar nos indicadores.'}
        </p>
        <div className="mt-4 flex gap-2">
          <button className={primaryClass} type="button" onClick={() => void confirmCancel()}>
            {cancelTarget?.kind === 'series'
              ? 'Cancelar série'
              : cancelTarget?.kind === 'many'
                ? 'Cancelar selecionados'
                : 'Cancelar lançamento'}
          </button>
          <button className={secondaryClass} type="button" onClick={() => setCancelTarget(null)}>
            Voltar
          </button>
        </div>
      </Modal>
    </div>
  );
}

function FilterCard({
  children,
  icon,
  label,
  trailing = true,
}: {
  children: ReactNode;
  icon?: ReactNode;
  label: string;
  trailing?: boolean;
}) {
  return (
    <label className="flex min-h-[76px] flex-col justify-center gap-1 rounded-2xl border border-navy/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-navy">
      <span className="text-xs font-medium text-navy/45 dark:text-white/50">{label}</span>
      <span className="flex items-center gap-2">
        {icon}
        <span className="relative min-w-0 flex-1">
          {children}
          {trailing ? <ChevronIcon /> : null}
        </span>
      </span>
    </label>
  );
}

function SummaryCard({
  caption,
  icon,
  label,
  value,
}: {
  caption?: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-navy/10 bg-white px-5 py-4 dark:border-white/10 dark:bg-navy dark:text-white">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-accent" />
      <div>
        <p className="text-[11px] font-semibold tracking-[0.08em] text-navy/45 uppercase dark:text-white/50">{label}</p>
        {value ? <p className="mt-2 text-[28px] leading-none font-semibold tracking-[-0.03em]">{value}</p> : null}
        {caption ? <p className="mt-2 text-xs text-navy/45 dark:text-white/50">{caption}</p> : null}
      </div>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-navy/70 dark:text-white/70">
        {icon}
      </span>
    </article>
  );
}

function ExpenseRow({
  item,
  menuOpen,
  onCancel,
  onCancelSeries,
  onSelect,
  onToggleMenu,
  selected,
}: {
  item: ExpenseItem;
  menuOpen: boolean;
  onCancel: () => void;
  onCancelSeries: () => void;
  onSelect: (checked: boolean) => void;
  onToggleMenu: () => void;
  selected: boolean;
}) {
  const cell = 'border-b border-navy/5 px-3 py-3.5 text-navy/75 dark:border-white/10 dark:text-white/75';

  return (
    <tr>
      <td className={cell}>
        <input
          aria-label={`Selecionar ${item.description}`}
          checked={selected}
          type="checkbox"
          onChange={(event) => onSelect(event.target.checked)}
        />
      </td>
      <td className={`${cell} font-medium text-navy dark:text-white`}>{item.description}</td>
      <td className={cell}>{item.categoryName}</td>
      <td className={cell}>{item.supplierName || '—'}</td>
      <td className={cell}>{competenceShort(item.competenceMonth)}</td>
      <td className={cell}>{formatIsoDate(item.dueOn)}</td>
      <td className={`${cell} text-right font-semibold text-navy dark:text-white`}>{formatCentsBRL(item.amountCents)}</td>
      <td className={cell}>
        <StatusPill status={item.status} />
      </td>
      <td className={cell}>{recurrenceLabel(item.recurrence)}</td>
      <td className={`${cell} relative text-right`}>
        <div className="flex items-center justify-end gap-1">
          <Link
            className="rounded-lg px-2 py-1 text-sm font-medium text-navy/70 hover:bg-navy/5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:text-white/70"
            href={`/portal/financeiro/despesas/${item.id}`}
          >
            Ver
          </Link>
          <button
            aria-expanded={menuOpen}
            aria-label="Ações do lançamento"
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-navy/45 hover:bg-navy/5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:text-white/50"
            type="button"
            onClick={onToggleMenu}
          >
            <KebabIcon />
          </button>
        </div>
        {menuOpen ? (
          <span className="absolute top-full right-3 z-10 flex min-w-40 flex-col rounded-xl border border-navy/10 bg-white p-1 text-left shadow-lg dark:border-white/10 dark:bg-navy">
            <Link className="rounded-lg px-3 py-2 text-sm hover:bg-off-white" href={`/portal/financeiro/despesas/${item.id}/editar`}>
              Editar
            </Link>
            {item.status !== 'cancelled' ? (
              <button className="rounded-lg px-3 py-2 text-left text-sm hover:bg-off-white" type="button" onClick={onCancel}>
                Cancelar
              </button>
            ) : null}
            {item.seriesId && item.status !== 'cancelled' ? (
              <button className="rounded-lg px-3 py-2 text-left text-sm hover:bg-off-white" type="button" onClick={onCancelSeries}>
                Cancelar série
              </button>
            ) : null}
          </span>
        ) : null}
      </td>
    </tr>
  );
}

function StatusPill({ status }: { status: ExpenseItem['status'] }) {
  const tone =
    status === 'paid'
      ? 'bg-accent/25 text-[#4f6712]'
      : status === 'pending'
        ? 'bg-[#F5A524]/15 text-[#8a5a10]'
        : 'bg-navy/5 text-navy/50';
  const dot = status === 'paid' ? 'bg-[#7ea312]' : status === 'pending' ? 'bg-[#F5A524]' : 'bg-navy/30';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dot}`} />
      {expenseStatusLabel(status)}
    </span>
  );
}

function ExpenseCategoriesDialog({
  categories,
  onClose,
  onSaved,
  open,
}: {
  categories: ExpenseCategoryNode[];
  onClose: () => void;
  onSaved: (categories: ExpenseCategoryNode[]) => void;
  open: boolean;
}) {
  const [name, setName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [categoryId, setCategoryId] = useState('');

  async function refresh(messageCategory = true) {
    const next = await listExpenseCategories();
    onSaved(next);
    if (!messageCategory) {
      return;
    }
  }

  return (
    <Modal labelledBy="expense-categories-title" open={open} onClose={onClose} tone="light">
      <h2 id="expense-categories-title">Categorias</h2>
      <div className="mt-4 space-y-4">
        {categories.map((category) => (
          <div key={category.id}>
            <p>
              {category.name}
              {category.active ? '' : ' Inativa'}
            </p>
            <button
              type="button"
              onClick={() => {
                const next = window.prompt('Editar', category.name);
                if (next) {
                  void updateExpenseCategory(category.id, { name: next }).then(() => refresh());
                }
              }}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => void updateExpenseCategory(category.id, { active: !category.active }).then(() => refresh())}
            >
              {category.active ? 'Inativar' : 'Ativar'}
            </button>
            {category.expenseCount === 0 && category.subcategories.length === 0 ? (
              <button type="button" onClick={() => void deleteExpenseCategory(category.id).then(() => refresh())}>
                Excluir
              </button>
            ) : null}
            <ul>
              {category.subcategories.map((subcategory) => (
                <li key={subcategory.id}>
                  {subcategory.name}
                  {subcategory.active ? '' : ' Inativa'}
                  <button
                    type="button"
                    onClick={() => {
                      const next = window.prompt('Editar', subcategory.name);
                      if (next) {
                        void updateExpenseSubcategory(subcategory.id, { name: next }).then(() => refresh());
                      }
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void updateExpenseSubcategory(subcategory.id, { active: !subcategory.active }).then(() => refresh())
                    }
                  >
                    {subcategory.active ? 'Inativar' : 'Ativar'}
                  </button>
                  {subcategory.expenseCount === 0 ? (
                    <button type="button" onClick={() => void deleteExpenseSubcategory(subcategory.id).then(() => refresh())}>
                      Excluir
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <label>
          Nova categoria
          <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <button
          type="button"
          onClick={() => {
            if (!name.trim()) {
              return;
            }

            void createExpenseCategory(name.trim()).then(() => {
              setName('');
              return refresh();
            });
          }}
        >
          Nova categoria
        </button>
        <label>
          Nova subcategoria
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Selecione</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            className={fieldClass}
            value={subcategoryName}
            onChange={(event) => setSubcategoryName(event.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            if (!categoryId || !subcategoryName.trim()) {
              return;
            }

            void createExpenseSubcategory(categoryId, subcategoryName.trim()).then(() => {
              setSubcategoryName('');
              return refresh();
            });
          }}
        >
          Nova subcategoria
        </button>
      </div>
    </Modal>
  );
}

function toggleSort(
  replaceFilters: (next: (current: ExpenseFilters) => ExpenseFilters) => void,
  sort: ExpenseSort,
) {
  replaceFilters((current) => {
    if (current.sort === sort) {
      return { ...current, direction: current.direction === 'asc' ? 'desc' : 'asc', page: 1 };
    }

    return { ...current, direction: sort === 'competence' ? 'desc' : 'asc', page: 1, sort };
  });
}

function ariaSort(filters: ExpenseFilters, sort: ExpenseSort): 'ascending' | 'descending' | 'none' {
  if (filters.sort !== sort) {
    return 'none';
  }

  return filters.direction === 'asc' ? 'ascending' : 'descending';
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 16 16">
      <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronIcon({ direction = 'down' }: { direction?: 'down' | 'left' | 'right' }) {
  const rotation = direction === 'left' ? 'rotate-90' : direction === 'right' ? '-rotate-90' : '';

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none size-4 text-navy/40 ${direction === 'down' ? 'absolute top-1/2 right-0 -translate-y-1/2' : ''} ${rotation}`}
      fill="none"
      viewBox="0 0 16 16"
    >
      <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="size-4 shrink-0 text-navy/40" fill="none" viewBox="0 0 16 16">
      <rect height="11" rx="2" stroke="currentColor" strokeWidth="1.4" width="12" x="2" y="3" />
      <path d="M2 6.5h12M5 2v2.5M11 2v2.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-navy/40" fill="none" viewBox="0 0 16 16">
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10.5 13.5 13.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 20 20">
      <path d="M6 3.5h5.2L15.5 8v8.5a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 3.5V8h4.5M7.5 11.5h5M7.5 14h3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.2 10.2 9.1 12.1 13 8.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6.8V10l2.2 1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 20 20">
      <path d="M4 6h12M4 10h12M4 14h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function KebabIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="currentColor" viewBox="0 0 16 16">
      <circle cx="8" cy="3.5" r="1.1" />
      <circle cx="8" cy="8" r="1.1" />
      <circle cx="8" cy="12.5" r="1.1" />
    </svg>
  );
}
