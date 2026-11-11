import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeDocument } from './page';

describe('Home', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('renders the leading page heading and sections', () => {
    render(<HomeDocument />);

    expect(screen.getByRole('heading', { level: 1, name: /antes do código/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /não criamos tecnologia/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /o negócio define a direção/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /começamos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /tecnologia construída/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no fim, tecnologia é meio/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /qual problema do seu negócio/i }),
    ).toBeInTheDocument();
  });

  it('renders the lead capture mailto action', () => {
    render(<HomeDocument />);

    const contactLinks = screen.getAllByRole('link', { name: /conte seu desafio/i });

    expect(contactLinks.length).toBeGreaterThan(0);
    for (const link of contactLinks) {
      expect(link).toHaveAttribute('href', 'mailto:contato@vetor.tech');
    }
  });

  it('does not render sections outside the leading page layout', () => {
    render(<HomeDocument />);

    expect(screen.queryByText(/perfil do cliente/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/prova social/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cliksofthouse/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/clikcrm/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Social' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'LinkedIn' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Instagram' })).not.toBeInTheDocument();
  });

  it('exposes in-page anchors for header navigation', () => {
    const { container } = render(<HomeDocument />);

    expect(container.querySelector('#origem')).not.toBeNull();
    expect(container.querySelector('#servicos')).not.toBeNull();
    expect(container.querySelector('#processo')).not.toBeNull();
    expect(container.querySelector('#projetos')).not.toBeNull();
    expect(container.querySelector('#contato')).not.toBeNull();
  });

  it('keeps Impact on navy, distinct from the Projects off-white band', () => {
    const { container } = render(<HomeDocument />);

    const projects = container.querySelector('#projetos');
    const impact = within(container)
      .getByRole('heading', { name: /no fim, tecnologia é meio/i })
      .closest('section');

    expect(projects).toHaveClass('bg-off-white');
    expect(impact).toHaveClass('bg-navy');
    expect(impact).not.toHaveClass('bg-off-white');
  });

  it('renders the WhatsApp widget when a destination number is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '5511999999999');
    render(<HomeDocument />);

    const whatsAppUrl = 'https://wa.me/5511999999999';
    const control = screen.getByRole('link', {
      name: 'WhatsApp. Estou pronto para lhe atender.',
    });

    expect(control).toHaveAttribute('href', whatsAppUrl);
    expect(screen.getByRole('link', { name: 'Fale conosco' })).toHaveAttribute(
      'href',
      whatsAppUrl,
    );
    expect(screen.getByRole('link', { name: /fale sobre o seu desafio/i })).toHaveAttribute(
      'href',
      whatsAppUrl,
    );
    expect(screen.getByRole('link', { name: /conte seu desafio/i })).toHaveAttribute(
      'href',
      whatsAppUrl,
    );
    expect(screen.getByRole('img', { name: 'Robô' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'WhatsApp' })).not.toBeInTheDocument();
  });

  it('hides the WhatsApp widget when the destination number is empty', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '');
    render(<HomeDocument />);

    expect(
      screen.queryByRole('link', { name: 'WhatsApp. Estou pronto para lhe atender.' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Fale conosco' })).not.toBeInTheDocument();
  });

  it('renders the leadpage and not the portal login', () => {
    render(<HomeDocument />);

    expect(screen.getByRole('heading', { level: 1, name: /antes do código/i })).toBeInTheDocument();
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument();
  });
});
