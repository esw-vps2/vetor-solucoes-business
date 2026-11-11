export function ThumbsUpIcon({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 11v8H5v-8h3z" /><path d="M8 12.5 11 5c1 0 2 .8 2 2v3h5l-1.2 8H8" />
    </svg>
  );
}
