'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  children: ReactNode;
  labelledBy: string;
  onClose: () => void;
  open: boolean;
  showClose?: boolean;
  size?: 'lg' | 'md' | 'viewport';
  tone?: 'dark' | 'light';
}

const FOCUSABLE_SELECTOR =
  'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])';

export function Modal({
  children,
  labelledBy,
  onClose,
  open,
  showClose = true,
  size = 'md',
  tone = 'light',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousElement = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const initialFocus =
      dialog?.querySelector<HTMLElement>('input, textarea, select') ??
      dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    initialFocus?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialog) {
        return;
      }

      const elements = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousElement?.focus();
    };
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-navy/80 backdrop-blur-md motion-reduce:backdrop-blur-none">
      <div
        className="flex min-h-dvh items-center justify-center p-0 md:px-4 md:py-8"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          className={`relative h-dvh max-h-dvh min-h-0 w-full max-w-none overflow-y-auto overscroll-contain rounded-none p-6 shadow-2xl md:max-h-[calc(100dvh-4rem)] md:rounded-[28px] md:p-8 ${
            size === 'viewport'
              ? 'flex flex-col md:h-[calc(100dvh-4rem)] md:w-[calc(100vw-4rem)] md:max-w-[calc(100vw-4rem)]'
              : 'md:h-auto'
          } ${
            tone === 'light'
              ? 'border border-navy/10 bg-white text-navy'
              : 'border border-white/[0.08] bg-navy-50 text-text-primary'
          } ${size === 'lg' ? 'md:max-w-3xl' : size === 'viewport' ? '' : 'md:max-w-xl'}`}
        >
          {showClose ? (
            <button
              type="button"
              aria-label="Fechar janela"
              onClick={onClose}
              className={`sticky top-4 z-10 ml-auto mb-[-2.5rem] flex size-10 items-center justify-center rounded-full text-2xl transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                tone === 'light'
                  ? 'text-navy/50 hover:bg-navy/5 hover:text-navy'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
