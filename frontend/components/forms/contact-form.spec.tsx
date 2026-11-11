import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { ContactForm } from './contact-form';

describe('ContactForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the approved fields and shows the success state', async () => {
    const sendContact = vi.spyOn(api, 'sendContact').mockResolvedValue(undefined);
    const onComplete = vi.fn();

    render(<ContactForm onComplete={onComplete} />);
    fireEvent.change(screen.getByLabelText('Nome do Cliente'), {
      target: { value: 'Ana' },
    });
    fireEvent.change(screen.getByLabelText('Email do Cliente'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Descrição do Projeto'), {
      target: { value: 'Automação de processos' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));

    await waitFor(() => {
      expect(sendContact).toHaveBeenCalledWith({
        customerEmail: 'ana@example.com',
        customerName: 'Ana',
        projectDescription: 'Automação de processos',
      });
    });
    expect(
      await screen.findByRole('heading', { name: 'Mensagem enviada com sucesso.' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onComplete).toHaveBeenCalled();
  });
});
