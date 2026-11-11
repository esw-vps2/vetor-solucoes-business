import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Services } from './services';

describe('Services', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });
  it('renders capabilities and switches the selected objective', () => {
    render(<Services />);

    expect(
      screen.getByRole('heading', { name: /o negócio define a direção/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: /objetivos de negócio/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /decidir com clareza/i }));

    expect(screen.getByRole('tab', { name: /decidir com clareza/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('uses the light surface so it does not match the navy origin section', () => {
    const { container } = render(<Services />);
    const section = container.querySelector('#servicos');

    expect(section).toHaveClass('bg-off-white');
    expect(section).not.toHaveClass('bg-navy');
  });

  it('opens WhatsApp from the challenge CTA when a destination number is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '5511999999999');
    render(<Services />);

    const link = screen.getByRole('link', { name: /fale sobre o seu desafio/i });

    expect(link).toHaveAttribute('href', 'https://wa.me/5511999999999');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('scrolls to contact when the WhatsApp number is empty', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '');
    render(<Services />);

    expect(screen.getByRole('link', { name: /fale sobre o seu desafio/i })).toHaveAttribute(
      'href',
      '#contato',
    );
  });
});
