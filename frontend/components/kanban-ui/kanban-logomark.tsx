import { VETOR_SYMBOL_SRC } from './samples';

export function KanbanLogomark({ className = 'size-8' }: { className?: string }) {
  return (
    <img
      alt="VETOR"
      src={VETOR_SYMBOL_SRC}
      className={`rounded-xl object-contain shadow-[0_4px_8px_rgba(79,70,229,0.1)] ${className}`}
    />
  );
}
