import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PasswordInput } from './password-input';

describe('PasswordInput', () => {
  afterEach(() => {
    cleanup();
  });

  it('starts hidden with an icon-only eye toggle', () => {
    render(
      <label>
        Senha
        <PasswordInput name="password" />
      </label>,
    );

    const field = screen.getByLabelText('Senha');
    expect(field).toHaveAttribute('type', 'password');

    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle.textContent).toBe('');
    expect(toggle.querySelector('svg')).not.toBeNull();
  });

  it('exposes the password and opens the eye on click', () => {
    render(
      <label>
        Senha
        <PasswordInput name="password" defaultValue="secret" />
      </label>,
    );

    const toggle = screen.getByRole('button');
    fireEvent.click(toggle);

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle.querySelector('circle')).not.toBeNull();
  });

  it('hides the password with asterisks when the eye is closed', () => {
    render(
      <label>
        Senha
        <PasswordInput name="password" defaultValue="secret" />
      </label>,
    );

    const field = screen.getByLabelText('Senha');
    const toggle = screen.getByRole('button');
    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(field).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle.querySelector('circle')).toBeNull();
  });
});
