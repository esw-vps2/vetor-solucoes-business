export function KanbanAvatar({
  alt = '',
  fit = 'cover',
  size = 'sm',
  src,
}: {
  alt?: string;
  fit?: 'contain' | 'cover';
  size?: 'sm' | 'md' | 'lg';
  src: string;
}) {
  const box = size === 'lg' ? 'size-12' : size === 'md' ? 'size-10' : 'size-8';
  const objectFit = fit === 'contain' ? 'object-contain' : 'object-cover';
  const letterboxBg = fit === 'contain' ? 'bg-navy/10 dark:bg-white/10' : '';

  return (
    <div
      className={`relative ${box} shrink-0 overflow-hidden rounded-full ${letterboxBg}`}
    >
      <img
        alt={alt}
        src={src}
        className={`absolute inset-0 block h-full w-full max-h-full max-w-full ${objectFit} object-center`}
      />
    </div>
  );
}
