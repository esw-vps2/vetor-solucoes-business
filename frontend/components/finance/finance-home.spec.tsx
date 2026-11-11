import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PortalShell } from '@/components/layout/portal-shell';
import * as api from '@/lib/api/client';
import { formatCentsBRL, saoPauloCalendarDate } from '@/lib/finance';
import { FinanceHome } from './finance-home';

const admin: api.SafeUser = {
  age: 40,
  email: 'admin@example.com',
  enabledActions: [],
  firstName: 'Admin',
  id: 'admin-id',
  lastName: 'Vetor',
  photoUrl: '/brand/symbol-vetor.png',
  profile: 'Administrador',
  sex: 'M',
  tenantId: 'tenant-id',
  tenantName: 'VETOR',
  tenantSlug: 'vetor',
};

const usuario: api.SafeUser = {
  ...admin,
  email: 'ana@example.com',
  firstName: 'Ana',
  id: 'user-id',
  profile: 'Usuario',
  tenantName: 'Acme',
};

const tenantAdmin: api.SafeUser = {
  ...usuario,
  profile: 'AdministradorTenant',
};

const emptyProject: api.FinanceProject = {
  contract: null,
  contractedResultAmountCents: 0,
  costAmountCents: 0,
  openAmountCents: 0,
  paidAmountCents: 0,
  installmentCount: null,
  projectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  projectName: 'Portal',
  resultAmountCents: 0,
  tenantId: 'tenant-id',
  tenantName: 'VETOR',
  totalAmountCents: 0,
  workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  workspaceName: 'Delivery',
};

function moneyText(cents: number) {
  const expected = formatCentsBRL(cents).replace(/\u00a0/g, ' ');

  return (_content: string, element: Element | null) =>
    (element?.textContent ?? '').replace(/\u00a0/g, ' ') === expected;
}

function renderFinance(user: api.SafeUser) {
  return render(
    <PortalShell
      loggingOut={false}
      onLogout={vi.fn()}
      onUserUpdated={vi.fn()}
      pageTitle="Contratos"
      user={user}
    >
      <FinanceHome user={user} />
    </PortalShell>,
  );
}

describe('FinanceHome', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function mockNotes(list: api.TenantNote[] = []) {
    return vi.spyOn(api, 'listTenantNotes').mockResolvedValue(list);
  }

  it('announces the loading state while projects are being requested', () => {
    vi.spyOn(api, 'listFinanceProjects').mockImplementation(() => new Promise<never>(() => {}));

    renderFinance(admin);

    expect(screen.getByText('Carregando...')).toHaveAttribute('role', 'status');
  });

  it('announces the finance load error', async () => {
    vi.spyOn(api, 'listFinanceProjects').mockRejectedValue(new Error('Network failure'));

    renderFinance(admin);

    expect(await screen.findByText('Não foi possível carregar o financeiro.')).toHaveAttribute(
      'role',
      'alert',
    );
  });

  it('shows Contratos under Financeiro only for Administrador, with tenant totals', async () => {
    mockNotes();
    vi.spyOn(api, 'listFinanceProjects').mockResolvedValue({
      projects: [
        emptyProject,
        {
          ...emptyProject,
          contract: {
            endsOn: null,
            hasFile: false,
            originalName: null,
            signedOn: null,
            startsOn: null,
            installmentCount: 6,
            status: 'active',
            title: 'C-2',
            totalAmountCents: 200000,
          },
          installmentCount: 6,
          contractedResultAmountCents: 200000,
          projectId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          projectName: 'Site',
          tenantId: 'acme-id',
          tenantName: 'Acme',
          totalAmountCents: 200000,
          workspaceName: 'Growth',
        },
      ],
      totals: {
        contractedResultAmountCents: 200000,
        costAmountCents: 0,
        openAmountCents: 200000,
        paidAmountCents: 0,
        resultAmountCents: 0,
        totalAmountCents: 200000,
      },
    });
    vi.spyOn(api, 'getProjectFinance').mockResolvedValue({
      ...emptyProject,
      costs: [],
      installments: [],
      payments: [],
    });

    renderFinance(admin);

    expect(screen.getByRole('heading', { name: 'Contratos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Financeiro' }).querySelector('svg')).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Financeiro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Financeiro' }));
    expect(screen.getByRole('link', { name: 'Contratos' })).toHaveAttribute(
      'href',
      '/portal/financeiro',
    );
    expect(await screen.findByText('Portal')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(10);
    expect(screen.getAllByRole('button', { name: /^Editar / })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /^Excluir / })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /^Arquivos do projeto / })).toHaveLength(2);
    expect(screen.getByRole('combobox', { name: 'Tenant' })).toHaveValue('all');
    expect(screen.getByRole('option', { name: 'Todas' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'VETOR' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Acme' })).toBeInTheDocument();
    expect(screen.getAllByText('Tenant').length).toBeGreaterThan(0);
    expect(screen.getByText('Site')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo Projeto' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nova anotação' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Tenant' }), {
      target: { value: 'acme-id' },
    });
    expect(screen.queryByText('Portal')).not.toBeInTheDocument();
    expect(screen.getByText('Site')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Editar / })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /^Arquivos do projeto / })).toHaveLength(1);
    expect(screen.getAllByText('Workspace').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pago').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Valor Pendente').length).toBeGreaterThan(0);
    expect(screen.queryByText('Em aberto')).not.toBeInTheDocument();
    expect(screen.getAllByText('Parcelas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Custo').length).toBeGreaterThan(0);
    expect(screen.queryByText('Resultado')).not.toBeInTheDocument();
    expect(screen.queryByText('Resultado contratado')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo Projeto' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Nova anotação' })).toBeInTheDocument();
    expect(screen.getAllByText(moneyText(200000)).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByRole('combobox', { name: 'Tenant' }), {
      target: { value: 'all' },
    });
    expect(screen.queryByRole('button', { name: 'Nova anotação' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Novo Projeto' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Acme · Growth · Site' })).toBeInTheDocument();
  });

  it('creates a tenant note when a tenant is selected', async () => {
    vi.spyOn(api, 'listFinanceProjects').mockResolvedValue({
      projects: [
        emptyProject,
        {
          ...emptyProject,
          projectId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          projectName: 'Site',
          tenantId: 'acme-id',
          tenantName: 'Acme',
          workspaceName: 'Growth',
        },
      ],
      totals: {
        contractedResultAmountCents: 0,
        costAmountCents: 0,
        openAmountCents: 0,
        paidAmountCents: 0,
        resultAmountCents: 0,
        totalAmountCents: 0,
      },
    });
    const create = vi.spyOn(api, 'createTenantNote').mockResolvedValue({
      body: 'Detalhe interno',
      id: 'note-1',
      title: 'Follow-up',
      updatedAt: '2026-09-21T12:00:00.000Z',
    });
    vi.spyOn(api, 'listTenantNotes')
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        {
          body: 'Detalhe interno',
          id: 'note-1',
          title: 'Follow-up',
          updatedAt: '2026-09-21T12:00:00.000Z',
        },
      ]);

    renderFinance(admin);
    expect(await screen.findByText('Portal')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nova anotação' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Tenant' }), {
      target: { value: 'acme-id' },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Nova anotação' }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Follow-up' } });
    fireEvent.change(screen.getByLabelText('Anotação'), {
      target: { value: 'Detalhe interno' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith('acme-id', {
        body: 'Detalhe interno',
        title: 'Follow-up',
      });
    });
    expect(await screen.findByText('Operação realizada com sucesso.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Follow-up' })).toBeInTheDocument();
    expect(screen.queryByText('Detalhe interno')).not.toBeInTheDocument();
  });

  it('opens the selected project documents and uploads then downloads a file', async () => {
    const document: api.FinanceProjectDocument = {
      byteSize: 8,
      contentType: 'application/pdf',
      createdAt: '2026-10-14T10:00:00.000Z',
      id: 'document-id',
      originalName: 'budget.pdf',
      projectId: emptyProject.projectId,
    };
    vi.spyOn(api, 'listFinanceProjects').mockResolvedValue({
      projects: [emptyProject],
      totals: {
        contractedResultAmountCents: 0,
        costAmountCents: 0,
        openAmountCents: 0,
        paidAmountCents: 0,
        resultAmountCents: 0,
        totalAmountCents: 0,
      },
    });
    const listDocuments = vi
      .spyOn(api, 'listFinanceProjectDocuments')
      .mockResolvedValueOnce([])
      .mockResolvedValue([document]);
    const upload = vi.spyOn(api, 'uploadFinanceProjectDocument').mockResolvedValue(document);
    const download = vi.spyOn(api, 'downloadFinanceProjectDocument').mockResolvedValue();

    renderFinance(admin);
    fireEvent.click(
      await screen.findByRole('button', {
        name: `Arquivos do projeto ${emptyProject.projectName}`,
      }),
    );

    expect(await screen.findByRole('heading', { name: 'Arquivos de Portal' })).toBeInTheDocument();
    expect(await screen.findByText('Nenhum arquivo neste projeto.')).toBeInTheDocument();

    const file = new File(['%PDF-1.7'], 'budget.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Enviar arquivo'), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(upload).toHaveBeenCalledWith(emptyProject.projectId, file);
    });
    expect(await screen.findByText('budget.pdf')).toBeInTheDocument();
    expect(listDocuments).toHaveBeenCalledWith(emptyProject.projectId);

    fireEvent.click(screen.getByRole('button', { name: 'Baixar' }));
    await waitFor(() => {
      expect(download).toHaveBeenCalledWith(
        emptyProject.projectId,
        document.id,
        document.originalName,
      );
    });
  });

  it('shows the generic error without uploading a blocked document type', async () => {
    vi.spyOn(api, 'listFinanceProjects').mockResolvedValue({
      projects: [emptyProject],
      totals: {
        contractedResultAmountCents: 0,
        costAmountCents: 0,
        openAmountCents: 0,
        paidAmountCents: 0,
        resultAmountCents: 0,
        totalAmountCents: 0,
      },
    });
    vi.spyOn(api, 'listFinanceProjectDocuments').mockResolvedValue([]);
    const upload = vi.spyOn(api, 'uploadFinanceProjectDocument');

    renderFinance(admin);
    fireEvent.click(
      await screen.findByRole('button', {
        name: `Arquivos do projeto ${emptyProject.projectName}`,
      }),
    );
    await screen.findByText('Nenhum arquivo neste projeto.');

    fireEvent.change(screen.getByLabelText('Enviar arquivo'), {
      target: {
        files: [new File(['<svg />'], 'unsafe.svg', { type: 'image/svg+xml' })],
      },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir a operação.',
    );
    expect(upload).not.toHaveBeenCalled();
  });

  it('hides Financeiro and shows the forbidden copy for other profiles', () => {
    const list = vi.spyOn(api, 'listFinanceProjects');
    const { unmount } = renderFinance(usuario);

    expect(screen.queryByRole('button', { name: 'Financeiro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Financeiro/ })).not.toBeInTheDocument();
    expect(screen.getByText('Você não tem acesso ao financeiro.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Arquivos do projeto / })).not.toBeInTheDocument();
    expect(list).not.toHaveBeenCalled();
    unmount();
    renderFinance(tenantAdmin);
    expect(screen.queryByRole('button', { name: 'Financeiro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Financeiro/ })).not.toBeInTheDocument();
    expect(screen.getAllByText('Você não tem acesso ao financeiro.')).toHaveLength(1);
    expect(list).not.toHaveBeenCalled();
  });

  it('shows a project without a contract as zeros and does not create a project', async () => {
    const list = vi.spyOn(api, 'listFinanceProjects').mockResolvedValue({
      projects: [emptyProject],
      totals: {
        contractedResultAmountCents: 0,
        costAmountCents: 0,
        openAmountCents: 0,
        paidAmountCents: 0,
        resultAmountCents: 0,
        totalAmountCents: 0,
      },
    });
    const save = vi.spyOn(api, 'saveProjectContract');

    renderFinance(admin);

    expect(await screen.findByText('Sem contrato')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getAllByText(moneyText(0)).length).toBeGreaterThan(0);
    expect(list).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
  });

  it('saves a contract, paid amount, and a cost from the project modal', async () => {
    const listed = {
      projects: [emptyProject],
      totals: {
        contractedResultAmountCents: 0,
        costAmountCents: 0,
        openAmountCents: 0,
        paidAmountCents: 0,
        resultAmountCents: 0,
        totalAmountCents: 0,
      },
    };
    const updated: api.FinanceProject = {
      ...emptyProject,
      contract: {
        endsOn: null,
        hasFile: false,
        originalName: null,
        signedOn: null,
        startsOn: null,
        installmentCount: 3,
        status: 'active',
        title: 'C-1',
        totalAmountCents: 100000,
      },
      installmentCount: 3,
      contractedResultAmountCents: 60000,
      costAmountCents: 40000,
      openAmountCents: -50000,
      paidAmountCents: 150000,
      resultAmountCents: 110000,
      totalAmountCents: 100000,
    };
    vi.spyOn(api, 'listFinanceProjects')
      .mockResolvedValueOnce(listed)
      .mockResolvedValue({
        projects: [updated],
        totals: {
          contractedResultAmountCents: 60000,
          costAmountCents: 40000,
          openAmountCents: -50000,
          paidAmountCents: 150000,
          resultAmountCents: 110000,
          totalAmountCents: 100000,
        },
      });
    vi.spyOn(api, 'getProjectFinance').mockResolvedValue({
      ...emptyProject,
      costs: [],
      installments: [],
      payments: [],
    });
    const save = vi.spyOn(api, 'saveProjectContract').mockResolvedValue({
      ...updated.contract!,
      installments: [
        { amountCents: 10000, dueOn: null, position: 1 },
        { amountCents: 0, dueOn: null, position: 2 },
        { amountCents: 5000, dueOn: null, position: 3 },
      ],
    });
    const payment = vi.spyOn(api, 'createFinancePayment');
    const replaceCosts = vi.spyOn(api, 'replaceFinanceCostLines').mockResolvedValue([
      {
        amountCents: 40000,
        category: 'other',
        id: 'cost-1',
        incurredOn: '2026-09-21',
        label: 'Infraestrutura',
        note: null,
      },
    ]);

    renderFinance(admin);
    fireEvent.click(await screen.findByRole('button', { name: /^Editar / }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.change(await screen.findByLabelText('Número ou título'), {
      target: { value: 'C-1' },
    });
    fireEvent.change(screen.getByLabelText('Valor do contrato'), {
      target: { value: '1000,00' },
    });
    expect(screen.queryByRole('textbox', { name: 'Valor pago' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Número de parcelas'), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByLabelText('Parcela 1'), {
      target: { value: '100,00' },
    });
    fireEvent.change(screen.getByLabelText('Parcela 3'), {
      target: { value: '50,00' },
    });
    expect(screen.getByText(/Total das parcelas/)).toHaveTextContent('R$ 150,00');
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar custo' }));
    fireEvent.change(screen.getByLabelText('Nome do custo'), {
      target: { value: 'Infraestrutura' },
    });
    fireEvent.change(screen.getByLabelText('Valor'), {
      target: { value: '400,00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar custo' }));
    fireEvent.change(screen.getAllByLabelText('Nome do custo')[1], {
      target: { value: 'Imposto' },
    });
    fireEvent.change(screen.getAllByLabelText('Valor')[1], {
      target: { value: '10,00' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[1]);
    expect(screen.queryByDisplayValue('Imposto')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar custo' }));
    expect(screen.getByText('Enviar PDF')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        emptyProject.projectId,
        expect.objectContaining({
          installmentCount: 3,
          installments: [
            { amountCents: 10000, dueOn: null },
            { amountCents: 0, dueOn: null },
            { amountCents: 5000, dueOn: null },
          ],
          status: 'draft',
          title: 'C-1',
          totalAmountCents: 100000,
        }),
      );
      expect(payment).not.toHaveBeenCalled();
      expect(replaceCosts).toHaveBeenCalledWith(emptyProject.projectId, {
        lines: [{ amountCents: 40000, label: 'Infraestrutura' }],
      });
    });
    expect(await screen.findByText('Operação realizada com sucesso.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByText(moneyText(100000)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(moneyText(150000)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(moneyText(-50000)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(moneyText(40000)).length).toBeGreaterThan(0);
    expect(screen.queryByText('Resultado')).not.toBeInTheDocument();
  });

  it('keeps installment amounts when the count grows and reopens saved lines', async () => {
    const zeroTotals = {
      contractedResultAmountCents: 0,
      costAmountCents: 0,
      openAmountCents: 0,
      paidAmountCents: 0,
      resultAmountCents: 0,
      totalAmountCents: 0,
    };
    vi.spyOn(api, 'listFinanceProjects').mockResolvedValue({
      projects: [emptyProject],
      totals: zeroTotals,
    });
    vi.spyOn(api, 'getProjectFinance').mockResolvedValue({
      ...emptyProject,
      contract: {
        endsOn: null,
        hasFile: false,
        installmentCount: 2,
        originalName: null,
        signedOn: null,
        startsOn: null,
        status: 'draft',
        title: 'C-1',
        totalAmountCents: 100000,
      },
      costs: [
        {
          amountCents: 20000,
          category: 'other',
          id: 'cost-1',
          incurredOn: '2026-10-14',
          label: 'Registro',
          note: null,
        },
      ],
      installmentCount: 2,
      installments: [
        { amountCents: 10000, dueOn: '2026-11-01', position: 1 },
        { amountCents: 0, dueOn: null, position: 2 },
      ],
      payments: [],
    });

    renderFinance(admin);
    fireEvent.click(await screen.findByRole('button', { name: /^Editar / }));
    expect(await screen.findByLabelText('Parcela 1')).toHaveValue('100,00');
    expect(screen.getAllByLabelText('Vencimento')[0]).toHaveValue('2026-11-01');
    expect(screen.getByLabelText('Parcela 2')).toHaveValue('');
    expect(screen.getAllByLabelText('Vencimento')[1]).toHaveValue('');
    expect(screen.getByLabelText('Nome do custo')).toHaveValue('Registro');
    expect(screen.getByLabelText('Valor')).toHaveValue('200,00');
    fireEvent.change(screen.getByLabelText('Número de parcelas'), {
      target: { value: '3' },
    });
    expect(screen.getByLabelText('Parcela 1')).toHaveValue('100,00');
    expect(screen.getAllByLabelText('Vencimento')[0]).toHaveValue('2026-11-01');
    expect(screen.getByLabelText('Parcela 3')).toHaveValue('');
    expect(screen.getAllByLabelText('Vencimento')[2]).toHaveValue('');
  });

  it('derives paid and pending from installment due dates', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-09T15:00:00.000Z'));
    const plain = (cents: number) => formatCentsBRL(cents).replace(/\u00a0/g, ' ');
    const shown = (element: HTMLElement) => (element.textContent ?? '').replace(/\u00a0/g, ' ');

    try {
      vi.spyOn(api, 'listFinanceProjects').mockResolvedValue({
        projects: [emptyProject],
        totals: {
          contractedResultAmountCents: 0,
          costAmountCents: 0,
          openAmountCents: 0,
          paidAmountCents: 0,
          resultAmountCents: 0,
          totalAmountCents: 0,
        },
      });
      vi.spyOn(api, 'getProjectFinance').mockResolvedValue({
        ...emptyProject,
        costs: [],
        installments: [],
        payments: [],
      });
      const save = vi.spyOn(api, 'saveProjectContract');

      renderFinance(admin);
      fireEvent.click(await screen.findByRole('button', { name: /^Editar / }));
      const dialog = await screen.findByRole('dialog');
      fireEvent.change(await within(dialog).findByLabelText('Valor do contrato'), {
        target: { value: '1000,00' },
      });
      fireEvent.change(within(dialog).getByLabelText('Número de parcelas'), {
        target: { value: '3' },
      });
      fireEvent.change(within(dialog).getByLabelText('Parcela 1'), {
        target: { value: '100,00' },
      });
      fireEvent.change(within(dialog).getAllByLabelText('Vencimento')[0], {
        target: { value: saoPauloCalendarDate() },
      });
      fireEvent.change(within(dialog).getByLabelText('Parcela 2'), {
        target: { value: '50,00' },
      });
      fireEvent.change(within(dialog).getAllByLabelText('Vencimento')[1], {
        target: { value: '2026-11-10' },
      });
      fireEvent.change(within(dialog).getByLabelText('Parcela 3'), {
        target: { value: '20,00' },
      });

      expect(shown(within(dialog).getByText(/^Valor pago/))).toContain(plain(10000));
      expect(shown(within(dialog).getByText(/^Valor Pendente/))).toContain(plain(90000));

      fireEvent.change(within(dialog).getAllByLabelText('Vencimento')[0], {
        target: { value: '2026-11-10' },
      });
      expect(shown(within(dialog).getByText(/^Valor pago/))).toContain(plain(0));
      expect(shown(within(dialog).getByText(/^Valor Pendente/))).toContain(plain(100000));

      fireEvent.change(within(dialog).getByLabelText('Valor do contrato'), {
        target: { value: 'abc' },
      });
      expect(shown(within(dialog).getByText(/^Valor Pendente/))).toContain('—');

      fireEvent.change(within(dialog).getByLabelText('Valor do contrato'), {
        target: { value: '50,00' },
      });
      fireEvent.change(within(dialog).getAllByLabelText('Vencimento')[0], {
        target: { value: '2026-11-09' },
      });
      expect(shown(within(dialog).getByText(/^Valor Pendente/))).toContain(plain(-5000));
      expect(save).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects an incomplete cost, a long cost name, and an invalid installment amount', async () => {
    const zeroTotals = {
      contractedResultAmountCents: 0,
      costAmountCents: 0,
      openAmountCents: 0,
      paidAmountCents: 0,
      resultAmountCents: 0,
      totalAmountCents: 0,
    };
    vi.spyOn(api, 'listFinanceProjects').mockResolvedValue({
      projects: [emptyProject],
      totals: zeroTotals,
    });
    vi.spyOn(api, 'getProjectFinance').mockResolvedValue({
      ...emptyProject,
      costs: [],
      installments: [],
      payments: [],
    });
    const replaceCosts = vi.spyOn(api, 'replaceFinanceCostLines');

    renderFinance(admin);
    fireEvent.click(await screen.findByRole('button', { name: /^Editar / }));
    fireEvent.change(await screen.findByLabelText('Número ou título'), {
      target: { value: 'C-1' },
    });
    fireEvent.change(screen.getByLabelText('Valor do contrato'), {
      target: { value: '1000,00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar custo' }));
    fireEvent.change(screen.getByLabelText('Nome do custo'), {
      target: { value: 'Imposto' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Preencha todos os campos obrigatórios.',
    );
    expect(replaceCosts).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Nome do custo'), {
      target: { value: 'a'.repeat(81) },
    });
    fireEvent.change(screen.getByLabelText('Valor'), {
      target: { value: '10,00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O nome do custo deve ter no máximo 80 caracteres.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    fireEvent.change(screen.getByLabelText('Parcela 1'), {
      target: { value: 'abc' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Informe um valor válido em reais.');
    expect(replaceCosts).not.toHaveBeenCalled();
  });

  it('deletes a listed project after confirmation', async () => {
    const zeroTotals = {
      contractedResultAmountCents: 0,
      costAmountCents: 0,
      openAmountCents: 0,
      paidAmountCents: 0,
      resultAmountCents: 0,
      totalAmountCents: 0,
    };
    vi.spyOn(api, 'listFinanceProjects')
      .mockResolvedValueOnce({ projects: [emptyProject], totals: zeroTotals })
      .mockResolvedValue({ projects: [], totals: zeroTotals });
    const remove = vi.spyOn(api, 'deleteFinanceProject').mockResolvedValue();

    renderFinance(admin);
    fireEvent.click(await screen.findByRole('button', { name: /^Excluir / }));
    expect(
      screen.getByRole('heading', { name: 'Excluir este projeto e todos os cards?' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir' }).at(-1)!);

    await waitFor(() => {
      expect(remove).toHaveBeenCalledWith(emptyProject.projectId);
    });
    expect(await screen.findByText('Nenhum projeto neste tenant.')).toBeInTheDocument();
    expect(screen.getByText('Operação realizada com sucesso.')).toBeInTheDocument();
  });
});
