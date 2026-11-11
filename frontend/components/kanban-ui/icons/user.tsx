export function UserIcon({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3" /><path d="M6 19c.8-3 2.8-4.5 6-4.5s5.2 1.5 6 4.5" />
    </svg>
  );
}
