import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanLogomark } from './kanban-logomark';

describe('KanbanLogomark', () => {
  it('uses the VETOR symbol', () => {
    render(<KanbanLogomark />);
    const image = screen.getByRole('img', { name: 'VETOR' });
    expect(image).toHaveAttribute('src', '/brand/symbol-vetor.png');
    expect(image.className).toContain('rounded-xl');
  });
});
