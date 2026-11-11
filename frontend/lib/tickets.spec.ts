import { describe, expect, it } from 'vitest';
import { imageFilesFromClipboard, ticketCategoryLabel, ticketFeedback, ticketPriorityPresentation, ticketStatusLabel } from './tickets';

describe('ticket labels', () => {
  it('maps the recorded category and status catalogs', () => {
    expect(ticketCategoryLabel('financeiro_cobranca')).toBe('Financeiro/cobrança');
    expect(ticketStatusLabel('em_analise')).toBe('Em análise');
  });

  it('uses Baixa as the default priority label', () => {
    expect(ticketPriorityPresentation('low').label).toBe('Baixa');
    expect(ticketPriorityPresentation('medium').label).toBe('Média');
    expect(ticketPriorityPresentation('high').label).toBe('Alta');
    expect(ticketPriorityPresentation('unknown').label).toBe('Baixa');
  });

  it('reads pasted images and ignores other clipboard items', () => {
    const image = new File(['png'], '', { type: 'image/png' });
    const named = new File(['png'], 'cola.png', { type: 'image/png' });

    expect(
      imageFilesFromClipboard({
        items: [
          { getAsFile: () => null, kind: 'string', type: 'text/plain' },
          { getAsFile: () => image, kind: 'file', type: 'image/png' },
        ],
      }).map((file) => file.name),
    ).toEqual(['imagem.png']);
    expect(
      imageFilesFromClipboard({
        files: [named, new File(['x'], 'nota.txt', { type: 'text/plain' })],
      }).map((file) => file.name),
    ).toEqual(['cola.png']);
    expect(imageFilesFromClipboard(null)).toEqual([]);
  });

  it('maps feedback from the HTTP status', () => {
    expect(ticketFeedback(403)).toBe('Você não tem permissão para esta ação.');
    expect(ticketFeedback(404)).toBe('Este registro não existe.');
    expect(ticketFeedback(503)).toBe('Não foi possível concluir a operação.');
  });
});
