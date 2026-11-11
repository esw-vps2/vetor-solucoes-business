import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Header } from './header';

const push = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const configuredNumber = '5511999999999';

describe('Header', () => {
  const originalLocation = window.location;

  afterEach(() => {
    cleanup();
    document.body.replaceChildren();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    push.mockClear();
  });

  function renderHeader() {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', configuredNumber);
    return render(<Header />);
  }

  it('renders the brand and leading page navigation', () => {
    renderHeader();

    const logo = screen.getByRole('img', { name: 'VETOR' });

    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', expect.stringContaining('logo_vetor_dark.png'));
    expect(logo).toHaveClass('h-14', 'w-auto', 'brightness-0', 'invert', 'lg:h-16');
    expect(screen.getByRole('navigation').querySelectorAll('a')).toHaveLength(4);
    expect(
      [...screen.getByRole('navigation').querySelectorAll('a')].map((link) => [
        link.textContent,
        link.getAttribute('href'),
      ]),
    ).toEqual([
      ['Método', '#processo'],
      ['Serviços', '#servicos'],
      ['Empresa', '#origem'],
      ['Projetos', '#projetos'],
    ]);
    expect(screen.getAllByRole('link', { name: 'Fale conosco' })).toHaveLength(1);
    expect(screen.queryByRole('link', { name: 'Portal Vector' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /portal/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });

  it('scrolls to the matching section when a navigation link is clicked', () => {
    const origem = document.createElement('section');
    origem.id = 'origem';
    origem.scrollIntoView = vi.fn();
    document.body.appendChild(origem);

    renderHeader();
    fireEvent.click(screen.getByRole('link', { name: 'Empresa' }));

    expect(origem.scrollIntoView).toHaveBeenCalled();
  });

  it('opens WhatsApp from the header action instead of the email form', () => {
    renderHeader();

    const link = screen.getByRole('link', { name: 'Fale conosco' });

    expect(link).toHaveAttribute('href', `https://wa.me/${configuredNumber}`);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.queryByRole('dialog', { name: 'Fale conosco' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Email do Cliente')).not.toBeInTheDocument();
  });

  it('hides Fale conosco when the WhatsApp number is empty', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '');
    render(<Header />);

    expect(screen.queryByRole('link', { name: 'Fale conosco' })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Fale conosco' })).not.toBeInTheDocument();
  });

  it('does not expose a portal action in the desktop header', () => {
    renderHeader();

    expect(screen.queryByRole('link', { name: 'Portal Vector' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /portal/i })).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/portal"]')).toBeNull();
    expect(document.querySelector('a[href^="https://app.vps2.com.br"]')).toBeNull();

    fireEvent.click(screen.getByRole('link', { name: 'Fale conosco' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses the same WhatsApp link in the mobile menu', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const links = screen.getAllByRole('link', { name: 'Fale conosco' });

    expect(links).toHaveLength(2);

    for (const link of links) {
      expect(link).toHaveAttribute('href', `https://wa.me/${configuredNumber}`);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('does not expose a portal action in the mobile menu', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    expect(screen.queryByRole('link', { name: 'Portal Vector' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /portal/i })).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/portal"]')).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Fale conosco' })).toHaveLength(2);
  });

  it('opens /portal on the current origin when the installed app starts at /', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        hash: '',
        host: 'localhost:3000',
        hostname: 'localhost',
        href: 'http://localhost:3000/',
        origin: 'http://localhost:3000',
        pathname: '/',
        port: '3000',
        protocol: 'http:',
        search: '',
      },
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        addEventListener() {},
        removeEventListener() {},
      }),
    });

    renderHeader();

    expect(push).toHaveBeenCalledWith('/portal');
    expect(screen.queryByRole('dialog', { name: 'Portal Vector' })).not.toBeInTheDocument();
  });
});
