import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KanbanScope } from './kanban-scope';

describe('kanban kit contract', () => {
  it('stays inside the existing frontend without a new route or manifest change', () => {
    expect(existsSync('app/kanban')).toBe(false);
    expect(readdirSync('app')).not.toContain('kanban');
    const manifest = readFileSync('app/manifest.ts', 'utf8');
    expect(manifest).not.toContain('kanban-ui');
    const css = readFileSync('app/globals.css', 'utf8');
    expect(css).toContain("--font-sans: 'Inter'");
    const shell = readFileSync('components/layout/portal-shell.tsx', 'utf8');
    const leadpage = readFileSync('app/page.tsx', 'utf8');
    expect(shell).toContain('@/components/kanban-ui/kanban-input-text');
    expect(shell).toContain('@/components/kanban-ui/kanban-sidebar-item');
    expect(leadpage).not.toContain('kanban-ui');
    render(
      <KanbanScope>
        <p>Kit</p>
      </KanbanScope>,
    );
    expect(screen.getByText('Kit').parentElement?.className).toContain('font-plus-jakarta-sans');
    expect(screen.getByText('Kit').parentElement?.className).toContain('kanban-ui');
  });
});
