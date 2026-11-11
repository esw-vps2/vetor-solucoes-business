import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanPlaceholderLogo } from './kanban-placeholder-logo';

describe('KanbanPlaceholderLogo', () => {
  it('uses the VETOR symbol at 48 and 96', () => {
    const { rerender } = render(<KanbanPlaceholderLogo />);
    expect(screen.getByRole('img', { name: 'VETOR' })).toHaveAttribute('src', '/brand/symbol-vetor.png');
    expect(screen.getByRole('img', { name: 'VETOR' }).className).toContain('size-12');
    rerender(<KanbanPlaceholderLogo size={96} />);
    expect(screen.getByRole('img', { name: 'VETOR' }).className).toContain('size-24');
  });
});
