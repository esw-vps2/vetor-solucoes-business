import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { portalLoginUrl } from '@/lib/portal-app-host';
import { PortalVetorAgentPage } from './vetor-agent-page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/portal/vetor-agent',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api/ai-agent', () => ({
  createAiConversation: vi.fn().mockResolvedValue({
    createdAt: '2026-10-28T00:00:00.000Z',
    id: 'conversation-id',
    updatedAt: '2026-10-28T00:00:00.000Z',
  }),
  getAiPricing: vi.fn().mockResolvedValue({ tokenCostPerMillion: 0.6, usageCost: 0 }),
  getAiRun: vi.fn(),
  listAiConversations: vi.fn().mockResolvedValue({ items: [], limit: 20, page: 1 }),
  listAiMessages: vi.fn().mockResolvedValue([]),
  sendAiMessage: vi.fn(),
  subscribeToAiRun: vi.fn(() => () => undefined),
}));

const usuario: api.SafeUser = {
  age: 32,
  email: 'ana@example.com',
  enabledActions: [],
  firstName: 'Ana',
  id: 'user-id',
  lastName: 'Silva',
  photoUrl: '/brand/symbol-vetor.png',
  profile: 'Usuario',
  sex: 'F',
  tenantId: 'tenant-id',
  tenantName: 'Acme',
  tenantSlug: 'acme',
};

function setLocation(url: string) {
  const parsed = new URL(url);
  const assign = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      assign,
      hash: parsed.hash,
      host: parsed.host,
      hostname: parsed.hostname,
      href: parsed.href,
      origin: parsed.origin,
      pathname: parsed.pathname,
      port: parsed.port,
      protocol: parsed.protocol,
      search: parsed.search,
    },
  });
  return assign;
}

describe('PortalVetorAgentPage', () => {
  const originalLocation = window.location;

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('opens the workspace in the portal main column and does not call the network again', async () => {
    setLocation('https://app.vps2.com.br/portal/vetor-agent');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    vi.spyOn(api, 'getSession').mockResolvedValue({
      ...usuario,
      enabledActions: ['vetorAgent'],
    });
    const projects = vi.spyOn(api, 'listProjectWorkspaces');
    render(<PortalVetorAgentPage />);

    expect(
      await screen.findByRole('heading', { name: 'Inteligência Artificial' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegação do portal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Agente Beta' })).toHaveAttribute(
      'href',
      '/portal/vetor-agent',
    );
    expect(screen.getByRole('button', { name: 'Novo chat' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Buscar na navegação' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Voltar ao portal' })).not.toBeInTheDocument();
    expect(screen.getByRole('main').querySelector('img')).toBeNull();

    const main = screen.getByRole('main');
    const workspace = screen.getByRole('navigation', { name: 'Conversas' }).parentElement;
    expect(main.className).toContain('overflow-hidden');
    expect(main.className).not.toContain('px-3');
    expect(workspace?.className).toContain('h-full');
    expect(workspace?.className).not.toContain('h-dvh');
    expect(main.contains(workspace)).toBe(true);
    expect(main.contains(screen.getByRole('navigation', { name: 'Navegação do portal' }))).toBe(
      false,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Novo chat' }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(projects).not.toHaveBeenCalled();
    expect(api.getSession).toHaveBeenCalledTimes(1);
  });

  it('shows the workspace to Administrador through the existing full action set', async () => {
    setLocation('https://app.vps2.com.br/portal/vetor-agent');
    vi.spyOn(api, 'getSession').mockResolvedValue({
      ...usuario,
      enabledActions: [],
      profile: 'Administrador',
    });
    vi.spyOn(api, 'listProjectWorkspaces').mockResolvedValue([]);
    render(<PortalVetorAgentPage />);

    expect(await screen.findByRole('button', { name: 'Novo chat' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegação do portal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Inteligência Artificial' })).toBeInTheDocument();
  });

  it('denies the workspace when the session does not include vetorAgent', async () => {
    setLocation('https://app.vps2.com.br/portal/vetor-agent');
    vi.spyOn(api, 'getSession').mockResolvedValue(usuario);
    render(<PortalVetorAgentPage />);

    expect(await screen.findByText('Você não tem acesso ao Vetor Agent.')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegação do portal' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toContainElement(
      screen.getByText('Você não tem acesso ao Vetor Agent.'),
    );
    expect(screen.queryByRole('button', { name: 'Novo chat' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Agente Beta' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Voltar ao portal' })).not.toBeInTheDocument();
  });

  it('does not render the workspace for an unauthenticated caller on the portal host', async () => {
    setLocation('https://app.vps2.com.br/portal/vetor-agent');
    vi.spyOn(api, 'getSession').mockRejectedValue(new Error('no session'));
    render(<PortalVetorAgentPage />);

    expect(await screen.findByRole('heading', { name: 'Acesse sua conta' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Novo chat' })).not.toBeInTheDocument();
  });

  it('sends an unauthenticated leadpage visit away from the workspace', async () => {
    const assign = setLocation('http://localhost:3000/portal/vetor-agent');
    vi.spyOn(api, 'getSession').mockRejectedValue(new Error('no session'));
    render(<PortalVetorAgentPage />);

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith(portalLoginUrl('http://localhost:3000'));
    });
    expect(screen.queryByRole('button', { name: 'Novo chat' })).not.toBeInTheDocument();
  });
});
