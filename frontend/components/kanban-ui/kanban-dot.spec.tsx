import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanDot } from './kanban-dot';

describe('KanbanDot', () => {
  it('renders the indigo lane dot', () => {
    const { container } = render(<KanbanDot />);
    const dot = container.querySelector('span');
    expect(dot?.className).toContain('size-2.5');
    expect(dot?.className).toContain('bg-[#4f46e5]');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
  });
});
