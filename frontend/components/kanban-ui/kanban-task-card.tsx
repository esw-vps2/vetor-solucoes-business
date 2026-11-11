import { KanbanAvatarGroup } from './kanban-avatar-group';
import { KanbanBadge, type KanbanBadgeTone } from './kanban-badge';
import { KanbanProgressBar } from './kanban-progress-bar';
import { ChatTeardropDotsIcon } from './icons/chat-teardrop-dots';
import { CheckCircleIcon } from './icons/check-circle';

const cardChrome =
  'flex flex-col gap-4 overflow-hidden rounded-[24px] border border-[#e2e8f0] bg-white p-3 shadow-[0px_4px_8px_-2px_rgba(23,23,23,0.1),0px_2px_4px_-2px_rgba(23,23,23,0.06)]';

export function KanbanTaskCard({
  avatars = [],
  badge,
  badgeTone,
  checkCount,
  commentCount,
  description,
  overflow = 0,
  progress,
  progressLabel,
  progressTone,
  title,
}: {
  avatars?: { alt?: string; src: string }[];
  badge?: string;
  badgeTone?: KanbanBadgeTone;
  checkCount?: number | string;
  commentCount?: number | string;
  description?: string;
  overflow?: number;
  progress?: number;
  progressLabel?: string;
  progressTone?: 'amber' | 'green' | 'indigo';
  title: string;
}) {
  return (
    <article className={cardChrome}>
      <div className="flex flex-col gap-3">
        {badge ? <KanbanBadge tone={badgeTone}>{badge}</KanbanBadge> : null}
        <h3 className="text-base font-bold tracking-[-0.112px] text-[#1e293b]">{title}</h3>
        {description ? <p className="text-base leading-relaxed text-[#475569]">{description}</p> : null}
      </div>
      {progress !== undefined ? (
        <KanbanProgressBar tone={progressTone} value={progress} valueLabel={progressLabel} />
      ) : null}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <KanbanAvatarGroup people={avatars} overflow={overflow} />
        </div>
        <div className="flex gap-4 text-base font-semibold text-[#1e293b]">
          {commentCount !== undefined ? (
            <span className="inline-flex items-center gap-1">
              <ChatTeardropDotsIcon className="size-5" />
              {commentCount}
            </span>
          ) : null}
          {checkCount !== undefined ? (
            <span className="inline-flex items-center gap-1">
              <CheckCircleIcon className="size-5" />
              {checkCount}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
