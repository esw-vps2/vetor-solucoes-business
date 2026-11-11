'use client';

import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

function EyeClosedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Z" />
    </svg>
  );
}

function EyeOpenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

export function PasswordInput({
  className = '',
  containerClassName = 'mt-2',
  ...props
}: PasswordInputProps & { containerClassName?: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <span className={`relative block ${containerClassName}`.trim()}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`w-full pr-12 ${className}`.trim()}
      />
      <button
        type="button"
        aria-pressed={visible}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-current opacity-70 transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </button>
    </span>
  );
}
