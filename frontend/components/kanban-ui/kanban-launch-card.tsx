'use client';

import { KanbanAvatar } from './kanban-avatar';
import { KanbanBadge, type KanbanBadgeTone } from './kanban-badge';
import { ChatTeardropDotsIcon } from './icons/chat-teardrop-dots';
import { CheckCircleIcon } from './icons/check-circle';
import { ThumbsUpIcon } from './icons/thumbs-up';
import { focusRing } from './samples';

const cardChrome =
  'flex flex-col gap-4 overflow-hidden rounded-[24px] border border-[#e2e8f0] bg-white p-4 shadow-[0px_4px_8px_-2px_rgba(23,23,23,0.1),0px_2px_4px_-2px_rgba(23,23,23,0.06)]';

export function KanbanLaunchCard({
  assignee,
  badges = [],
  commentCount,
  coverSrc,
  dateLabel,
  onCheckedChange,
  onThumbsUp,
  thumbsUp,
  title,
}: {
  assignee?: { alt?: string; src: string };
  badges?: { label: string; tone: KanbanBadgeTone }[];
  commentCount?: number;
  coverSrc?: string;
  dateLabel?: string;
  onCheckedChange?: () => void;
  onThumbsUp?: () => void;
  thumbsUp?: number;
  title: string;
}) {
  return (
    <article className={cardChrome}>
      {coverSrc ? (
        <img alt="" src={coverSrc} className="h-60 w-full rounded-[16px] border border-[#e2e8f0] object-cover" />
      ) : null}
      <div className="flex items-start gap-2">
        <button type="button" aria-label={`Marcar ${title}`} onClick={onCheckedChange} className={`pt-0.5 ${focusRing}`}>
          <CheckCircleIcon className="size-5 text-[#475569]" />
        </button>
        <h3 className="text-base font-bold tracking-[-0.112px] text-[#1e293b]">{title}</h3>
      </div>
      {badges.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <KanbanBadge key={badge.label} tone={badge.tone}>
              {badge.label}
            </KanbanBadge>
          ))}
        </div>
      ) : null}
      {assignee || dateLabel || commentCount !== undefined || thumbsUp !== undefined ? (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2">
            {assignee ? <KanbanAvatar alt={assignee.alt ?? ''} src={assignee.src} /> : null}
            {dateLabel ? (
              <span className="text-sm font-semibold tracking-[-0.084px] text-[#475569]">{dateLabel}</span>
            ) : null}
          </div>
          {commentCount !== undefined ? (
            <span className="inline-flex items-center gap-1 text-base font-semibold text-[#1e293b]">
              <ChatTeardropDotsIcon className="size-5" />
              {commentCount}
            </span>
          ) : null}
          {thumbsUp !== undefined ? (
            <button type="button" onClick={onThumbsUp} className={`inline-flex items-center gap-1 text-base font-semibold text-[#1e293b] ${focusRing}`}>
              <ThumbsUpIcon className="size-5" />
              {thumbsUp}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
