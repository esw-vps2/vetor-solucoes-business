import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WhatsAppContact } from './whatsapp-contact';

const configuredNumber = '5511999999999';

describe('WhatsAppContact', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the robot and exact speech copy without a WhatsApp brand mark', () => {
    render(<WhatsAppContact number={configuredNumber} />);

    expect(screen.getByRole('img', { name: 'Robô' })).toBeInTheDocument();
    expect(screen.getByText('Estou pronto para lhe atender.')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'WhatsApp' })).not.toBeInTheDocument();
  });

  it('opens click-to-chat for the configured digits without hardcoding the number in source', () => {
    render(<WhatsAppContact number={configuredNumber} />);

    const control = screen.getByRole('link', {
      name: 'WhatsApp. Estou pronto para lhe atender.',
    });

    expect(control).toHaveAttribute('href', `https://wa.me/${configuredNumber}`);
    expect(control).toHaveAttribute('target', '_blank');
    expect(control).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('is keyboard reachable and has an accessible name', () => {
    render(<WhatsAppContact number={configuredNumber} />);

    const control = screen.getByRole('link', {
      name: 'WhatsApp. Estou pronto para lhe atender.',
    });

    control.focus();

    expect(control).toHaveFocus();
    expect(control).not.toHaveAttribute('tabindex', '-1');
  });

  it('keeps a reduced-motion hook on the decorative robot motion', () => {
    const { container } = render(<WhatsAppContact number={configuredNumber} />);

    expect(container.querySelector('.whatsapp-ready-motion')).not.toBeNull();
  });

  it('hides the widget when the environment value is empty', () => {
    const { container } = render(<WhatsAppContact number="" />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText('Estou pronto para lhe atender.')).not.toBeInTheDocument();
  });

  it('does not call the API or write browser storage when activated', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const storageSetItem = vi.spyOn(Storage.prototype, 'setItem');

    render(<WhatsAppContact number={configuredNumber} />);
    fireEvent.click(screen.getByRole('link', { name: 'WhatsApp. Estou pronto para lhe atender.' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(storageSetItem).not.toHaveBeenCalled();
  });
});
