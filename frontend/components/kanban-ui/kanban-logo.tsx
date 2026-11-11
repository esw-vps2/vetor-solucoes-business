import { VETOR_LOGO_SRC } from './samples';

export function KanbanLogo({ className = 'h-8 w-auto' }: { className?: string }) {
  return <img alt="VETOR" src={VETOR_LOGO_SRC} className={className} />;
}
