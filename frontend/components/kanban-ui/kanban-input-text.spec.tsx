import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KanbanInputText } from './kanban-input-text';

describe('KanbanInputText', () => {
  it('is a labeled search field and reports the typed value', () => {
    const onChange = vi.fn();
    render(<KanbanInputText value="" onChange={onChange} />);
    const field = screen.getByRole('searchbox', { name: 'Buscar' });
    expect(field).toHaveAttribute('placeholder', 'Buscar...');
    fireEvent.change(field, { target: { value: 'alpha' } });
    expect(onChange).toHaveBeenCalledWith('alpha');
  });
});
