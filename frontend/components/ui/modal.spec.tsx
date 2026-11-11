import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Modal } from './modal';

describe('Modal', () => {
  afterEach(() => {
    cleanup();
  });

  it('closes with Escape and an overlay click', () => {
    const onClose = vi.fn();

    render(
      <Modal open labelledBy="modal-title" onClose={onClose}>
        <h2 id="modal-title">Dialog</h2>
        <button type="button">Action</button>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement as HTMLElement, {
      target: screen.getByRole('dialog').parentElement,
      currentTarget: screen.getByRole('dialog').parentElement,
    });

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('focuses the first field when opened instead of the close button', () => {
    render(
      <Modal open labelledBy="modal-title" onClose={vi.fn()}>
        <h2 id="modal-title">Dialog</h2>
        <label>
          Senha
          <input name="password" type="password" />
        </label>
      </Modal>,
    );

    expect(screen.getByLabelText('Senha')).toHaveFocus();
  });

  it('keeps the password field focused when onClose identity changes', () => {
    const view = render(
      <Modal open labelledBy="modal-title" onClose={() => undefined}>
        <h2 id="modal-title">Dialog</h2>
        <label>
          Senha
          <input name="password" type="password" />
        </label>
      </Modal>,
    );

    const password = screen.getByLabelText('Senha');
    password.focus();
    fireEvent.change(password, { target: { value: 'g' } });

    view.rerender(
      <Modal open labelledBy="modal-title" onClose={() => undefined}>
        <h2 id="modal-title">Dialog</h2>
        <label>
          Senha
          <input name="password" type="password" />
        </label>
      </Modal>,
    );

    expect(password).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Fechar janela' })).not.toHaveFocus();
  });

  it('uses a white surface when tone is light', () => {
    render(
      <Modal open labelledBy="modal-title" onClose={() => undefined} tone="light">
        <h2 id="modal-title">Dialog</h2>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('bg-white');
    expect(dialog.className).toContain('text-navy');
    expect(dialog.className).not.toContain('bg-navy-50');
  });

  it('uses the white surface and form width by default', () => {
    render(
      <Modal open labelledBy="modal-title" onClose={() => undefined}>
        <h2 id="modal-title">Dialog</h2>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    const centeringWrapper = dialog.parentElement;
    const overlay = centeringWrapper?.parentElement;
    expect(overlay?.className).toContain('fixed');
    expect(overlay?.className).toContain('inset-0');
    expect(overlay?.className).toContain('z-[60]');
    expect(overlay?.className).toContain('overflow-y-auto');
    expect(overlay?.className).toContain('bg-navy/80');
    expect(overlay?.className).toContain('backdrop-blur-md');
    expect(centeringWrapper?.className).toContain('min-h-dvh');
    expect(centeringWrapper?.className).toContain('items-center');
    expect(centeringWrapper?.className).toContain('justify-center');
    expect(dialog.className).toContain('h-dvh');
    expect(dialog.className).toContain('max-h-dvh');
    expect(dialog.className).toContain('overflow-y-auto');
    expect(dialog.className).toContain('overscroll-contain');
    expect(dialog.className).toContain('rounded-none');
    expect(dialog.className).toContain('p-6');
    expect(dialog.className).toContain('md:rounded-[28px]');
    expect(dialog.className).toContain('md:p-8');
    expect(dialog.className).toContain('border-navy/10');
    expect(dialog.className).toContain('bg-white');
    expect(dialog.className).toContain('text-navy');
    expect(dialog.className).toContain('md:max-w-xl');
    expect(dialog.className).toContain('md:h-auto');
  });

  it('omits the close control when showClose is false', () => {
    render(
      <Modal open labelledBy="modal-title" onClose={() => undefined} showClose={false}>
        <h2 id="modal-title">Dialog</h2>
      </Modal>,
    );

    expect(screen.queryByRole('button', { name: 'Fechar janela' })).not.toBeInTheDocument();
  });

  it('uses a wider dialog when size is lg', () => {
    render(
      <Modal open labelledBy="modal-title" onClose={() => undefined} size="lg">
        <h2 id="modal-title">Dialog</h2>
      </Modal>,
    );

    expect(screen.getByRole('dialog').className).toContain('md:max-w-3xl');
  });

  it('renders on the document body so a filtered parent cannot trap it', () => {
    render(
      <div data-testid="filtered-parent" className="backdrop-blur-md">
        <Modal open labelledBy="modal-title" onClose={() => undefined} size="viewport">
          <h2 id="modal-title">Dialog</h2>
        </Modal>
      </div>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('md:h-[calc(100dvh-4rem)]');
    expect(dialog.className).toContain('md:w-[calc(100vw-4rem)]');
    expect(screen.getByTestId('filtered-parent').contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it('keeps the dialog inside the viewport and scrolls overflowing content', () => {
    render(
      <Modal open labelledBy="modal-title" onClose={() => undefined} size="lg">
        <h2 id="modal-title">Dialog</h2>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('max-h-dvh');
    expect(dialog.className).toContain('overflow-y-auto');
    expect(dialog.className).toContain('md:max-h-[calc(100dvh-4rem)]');
    expect(dialog.parentElement?.className).toContain('min-h-dvh');
  });
});
