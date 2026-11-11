import { KanbanAvatar } from './kanban-avatar';

export function KanbanAvatarGroup({
  people,
  overflow = 0,
}: {
  people: { alt?: string; src: string }[];
  overflow?: number;
}) {
  return (
    <div className="flex items-center">
      {people.map((person, index) => (
        <span key={`${person.src}-${index}`} className={index === 0 ? '' : '-ml-2'}>
          <span className="inline-flex rounded-full border-2 border-white">
            <KanbanAvatar alt={person.alt ?? ''} src={person.src} />
          </span>
        </span>
      ))}
      {overflow > 0 ? (
        <span className="-ml-2 inline-flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#eef2ff] text-sm font-extrabold text-[#4f46e5]">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
