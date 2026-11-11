import type { ReactNode } from 'react';

interface BrowserFrameProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

export function BrowserFrame({ children, label, className = '' }: BrowserFrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-[28px] border border-white/[0.08] bg-navy-100 shadow-[0_28px_80px_rgba(6,11,24,0.45)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
        <span className="size-2.5 rounded-full bg-[#FF5F57]" aria-hidden="true" />
        <span className="size-2.5 rounded-full bg-[#FEBC2E]" aria-hidden="true" />
        <span className="size-2.5 rounded-full bg-[#28C840]" aria-hidden="true" />
        {label ? (
          <span className="ml-2 text-[0.65rem] font-medium tracking-[0.04em] text-white/35">
            {label}
          </span>
        ) : null}
      </div>
      <div>{children}</div>
    </div>
  );
}
