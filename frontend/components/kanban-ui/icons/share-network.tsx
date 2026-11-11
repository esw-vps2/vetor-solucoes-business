export function ShareNetworkIcon({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="12" r="2.2" /><circle cx="16" cy="7" r="2.2" /><circle cx="16" cy="17" r="2.2" /><path d="m9 11 5-3M9 13l5 3" />
    </svg>
  );
}
