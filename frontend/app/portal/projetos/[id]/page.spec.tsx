import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { portalLoginUrl } from '@/lib/portal-app-host';
import PortalProjetoBoardPage from './page';

describe('PortalProjetoBoardPage', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('redirects an unauthenticated leadpage portal route to the dedicated login', async () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        assign,
        hash: '',
        host: 'localhost:3000',
        hostname: 'localhost',
        href: 'http://localhost:3000/portal/projetos/proj-1?card=card-1',
        origin: 'http://localhost:3000',
        pathname: '/portal/projetos/proj-1',
        port: '3000',
        protocol: 'http:',
        search: '?card=card-1',
      },
    });
    vi.spyOn(api, 'getSession').mockRejectedValue(new Error('no session'));
    render(<PortalProjetoBoardPage />);

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith(portalLoginUrl('http://localhost:3000'));
    });
    expect(screen.queryByLabelText('E-mail')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Sua sessão não está ativa' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('card-1')).not.toBeInTheDocument();
  });
});
