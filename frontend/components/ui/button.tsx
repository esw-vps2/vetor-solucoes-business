'use client';

import { motion } from 'framer-motion';
import { scrollToHash } from '@/lib/scroll-to-hash';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'inverse';
  size?: 'md' | 'lg';
  href?: string;
  className?: string;
  target?: string;
  rel?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href = '#contato',
  className = '',
  target,
  rel,
}: ButtonProps) {
  const base =
    'group relative inline-flex items-center gap-2.5 font-medium cursor-pointer transition-all duration-500';

  const v = {
    primary: 'bg-accent text-navy-100 rounded-full hover:shadow-[0_0_40px_rgba(189,218,43,0.25)]',
    secondary:
      'bg-white/[0.05] backdrop-blur-md text-text-primary rounded-full border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.14]',
    ghost: 'text-text-secondary hover:text-accent rounded-full',
    inverse:
      'bg-navy text-white rounded-full hover:bg-navy-100 hover:shadow-[0_12px_32px_rgba(6,11,24,0.18)]',
  };

  const s = {
    md: 'px-7 py-3 text-[0.82rem] tracking-[0.01em]',
    lg: 'px-9 py-4 text-[0.88rem] tracking-[0.01em]',
  };

  return (
    <motion.a
      href={href}
      target={target}
      rel={rel}
      onClick={(event) => {
        if (!href.startsWith('#')) {
          return;
        }
        event.preventDefault();
        scrollToHash(href);
      }}
      className={`${base} ${v[variant]} ${s[size]} ${className}`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
      <svg
        className="w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
      </svg>
    </motion.a>
  );
}
