import type { ReactNode } from 'react';

interface SectionEyebrowProps {
  children: ReactNode;
  tone?: 'dark' | 'light' | 'accent';
}

export function SectionEyebrow({ children, tone = 'dark' }: SectionEyebrowProps) {
  const tones = {
    dark: 'border-white/[0.08] bg-white/[0.06] text-white/80',
    light: 'border-black/[0.06] bg-white text-text-dark shadow-[0_8px_24px_rgba(13,19,33,0.04)]',
    accent: 'border-accent/20 bg-accent text-navy',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-[0.68rem] font-medium tracking-[0.04em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
