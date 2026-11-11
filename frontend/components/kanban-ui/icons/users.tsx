export function UsersIcon({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="3" /><path d="M4 19c.6-2.5 2.5-4 5-4s4.4 1.5 5 4" /><circle cx="16" cy="9" r="2.5" /><path d="M16 15c2 .3 3.5 1.5 4 4" />
    </svg>
  );
}
