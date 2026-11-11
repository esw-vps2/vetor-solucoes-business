import type { ReactNode } from 'react';

interface FeatureRowProps {
  title: string;
  description: string;
  icon: ReactNode;
  tone?: 'light' | 'dark';
}

export function FeatureRow({ title, description, icon, tone = 'light' }: FeatureRowProps) {
  const isLight = tone === 'light';

  return (
    <div
      className={`flex items-start gap-4 rounded-[22px] px-5 py-4 ${
        isLight
          ? 'border border-black/[0.04] bg-white shadow-[0_10px_30px_rgba(13,19,33,0.04)]'
          : 'border border-white/[0.06] bg-white/[0.03]'
      }`}
    >
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          isLight ? 'bg-off-white text-accent' : 'bg-white/[0.06] text-accent'
        }`}
      >
        {icon}
      </div>
      <div>
        <p
          className={`text-[0.95rem] font-semibold leading-snug ${
            isLight ? 'text-text-dark' : 'text-white'
          }`}
        >
          {title}
        </p>
        <p
          className={`mt-1 text-[0.82rem] leading-relaxed ${
            isLight ? 'text-text-dark-secondary' : 'text-text-secondary'
          }`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
