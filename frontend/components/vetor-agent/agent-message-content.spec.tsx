import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AgentMessageContent } from './agent-message-content';

describe('AgentMessageContent', () => {
  it('preserves user line breaks', () => {
    const { container } = render(
      <AgentMessageContent content={'Linha 1\nLinha 2'} role="user" />,
    );

    expect(container.textContent).toBe('Linha 1\nLinha 2');
  });

  it('renders assistant markdown lists and emphasis', () => {
    render(
      <AgentMessageContent
        content={'**Nemotron 3 Ultra**\n\n- Item one\n- Item two'}
        role="assistant"
      />,
    );

    expect(screen.getByText('Nemotron 3 Ultra')).toBeInTheDocument();
    expect(screen.getByText('Item one')).toBeInTheDocument();
    expect(screen.getByText('Item two')).toBeInTheDocument();
  });

  it('keeps streaming assistant text as plain text', () => {
    render(<AgentMessageContent content={'**ok**'} role="assistant" streaming />);

    expect(screen.getByText('**ok**')).toBeInTheDocument();
  });

  it('does not render raw script tags from assistant content', () => {
    render(
      <AgentMessageContent content={'<script>alert(1)</script>\n\nSafe text'} role="assistant" />,
    );

    expect(screen.queryByText('alert(1)')).not.toBeInTheDocument();
    expect(screen.getByText('Safe text')).toBeInTheDocument();
  });
});
