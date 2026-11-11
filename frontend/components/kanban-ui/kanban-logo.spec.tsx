import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanLogo } from './kanban-logo';

describe('KanbanLogo', () => {
  it('uses the VETOR lockup', () => {
    render(<KanbanLogo />);
    expect(screen.getByRole('img', { name: 'VETOR' })).toHaveAttribute('src', '/brand/logo_vetor.png');
  });
});
