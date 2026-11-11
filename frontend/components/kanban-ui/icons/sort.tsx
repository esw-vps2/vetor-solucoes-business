export function SortIcon({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 7v10" />
      <path d="m5 10 3-3 3 3" />
      <path d="M16 17V7" />
      <path d="m13 14 3 3 3-3" />
    </svg>
  );
}
