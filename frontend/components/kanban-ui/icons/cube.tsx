export function CubeIcon({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3z" /><path d="M12 12 20 7.5M12 12v9M12 12 4 7.5" />
    </svg>
  );
}
