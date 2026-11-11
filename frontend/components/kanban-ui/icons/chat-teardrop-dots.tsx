export function ChatTeardropDotsIcon({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20c5 0 8-3.2 8-7.2S16.4 5 12 5 4 8.4 4 12.8c0 2 .8 3.6 2 4.8L5 20l3.2-1.2c1.1.7 2.4 1.2 3.8 1.2z" /><circle cx="8.5" cy="12.5" r=".8" fill="currentColor" stroke="none" /><circle cx="12" cy="12.5" r=".8" fill="currentColor" stroke="none" /><circle cx="15.5" cy="12.5" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}
