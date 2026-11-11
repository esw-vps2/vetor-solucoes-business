'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent, FormEvent, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  addCardAttachment,
  cardAttachmentSrc,
  createCardComment,
  createChecklistItem,
  createProjectCard,
  deleteCardAttachment,
  deleteCardComment,
  deleteChecklistItem,
  deleteProjectBackground,
  deleteProjectCard,
  getProjectBoard,
  listUsers,
  placeProjectCard,
  projectBackgroundSrc,
  publicPhotoSrc,
  putProjectBackground,
  updateProjectKanbanFilters,
  updateProjectKanbanLanes,
  uploadProjectDocuments,
  updateCardComment,
  updateChecklistItem,
  updateProjectCard,
  type ProjectBoard,
  type KanbanFilters,
  type ProjectCard,
  type SafeUser,
  type UserListItem,
} from '@/lib/api/client';
import {
  canConfigureLane,
  canManageProjectWorkspaces,
  canMoveCards,
  canSetBoardBackground,
  canViewProjects,
} from '@/lib/portal-actions';
import {
  addCardLaneLabel,
  assigneeInitials,
  BACKGROUND_FILE_ACCEPT,
  BOARD_EASE,
  CARD_PRIORITIES,
  cardAttachmentsToUpload,
  cardMatchesKanbanFilters,
  filterCardAssigneeCandidates,
  dateInputFromDueAt,
  dueAtFromDateInput,
  DUE_URGENCY_CLASS,
  dueUrgency,
  EMPTY_KANBAN_FILTERS,
  formatDateTime,
  formatDueAt,
  IMAGE_PROJECT_FILE_TYPES,
  isAllowedBackgroundFile,
  isAllowedProjectFile,
  kanbanFiltersArePersistable,
  lanePresentation,
  PROJECT_COPY,
  PROJECT_FILE_ACCEPT,
  projectErrorMessage,
  type ProjectErrorKind,
} from '@/lib/project-kanban';
import { Modal } from '@/components/ui/modal';
import { KanbanAvatar } from '@/components/kanban-ui/kanban-avatar';
import { KanbanButton } from '@/components/kanban-ui/kanban-button';
import { KanbanLaneHeader } from '@/components/kanban-ui/kanban-lane-header';
import { KanbanScope } from '@/components/kanban-ui/kanban-scope';
import { focusRing } from '@/components/kanban-ui/samples';
import { ChatTeardropDotsIcon } from '@/components/kanban-ui/icons/chat-teardrop-dots';
import { ShareNetworkIcon } from '@/components/kanban-ui/icons/share-network';
import { PlusIcon } from '@/components/kanban-ui/icons/plus';
import { UploadIcon } from '@/components/kanban-ui/icons/upload';
import { ProjectBoardFilters } from './project-board-filters';
import { ProjectFilesPanel } from './project-files-panel';

interface ProjectBoardViewProps {
  projectId: string;
  user: SafeUser;
}

function hydrateBoard(board: ProjectBoard): ProjectBoard {
  return {
    ...board,
    documents: board.documents ?? [],
    kanbanFilters: board.kanbanFilters ?? null,
    lanes: board.lanes.map((lane) => ({
      ...lane,
      cards: lane.cards.map((card) => ({
        ...card,
        attachments: card.attachments ?? [],
        checklistItems: card.checklistItems ?? [],
        comments: card.comments ?? [],
        startsAt: card.startsAt ?? null,
        tags: card.tags ?? [],
      })),
    })),
  };
}

const fieldClass =
  'mt-2 w-full rounded-2xl border border-navy/10 bg-white px-3 py-2 text-sm text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';

const modalFieldClass =
  'mt-2 w-full rounded-2xl border border-navy/10 bg-white px-3 py-2 text-sm text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';

const modalGhostClass =
  'rounded-full border border-navy/15 bg-white px-3 py-1 text-xs font-semibold text-navy transition hover:bg-navy/5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';

interface DraftChecklistItem {
  body: string;
  id?: string;
}

export function ProjectBoardView({ projectId, user }: ProjectBoardViewProps) {
  const canMove = canMoveCards(user);
  const canUseBoard = canViewProjects(user);
  const canBackground = canSetBoardBackground(user);
  const canPersistFilters = canManageProjectWorkspaces(user);
  const canCreateLane = canConfigureLane(user, 'createLane');
  const canRenameLane = canConfigureLane(user, 'renameLane');
  const canDeleteLane = canConfigureLane(user, 'deleteLane');
  const reducedMotion = useReducedMotion();
  const [board, setBoard] = useState<ProjectBoard | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dismissedQueryId, setDismissedQueryId] = useState<string | null>(null);
  const [cardDraft, setCardDraft] = useState<
    { kind: 'create' } | { kind: 'edit'; card: ProjectCard } | null
  >(null);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [filesOpen, setFilesOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropLane, setDropLane] = useState<string | null>(null);
  const [draggingLaneKey, setDraggingLaneKey] = useState<string | null>(null);
  const [laneDropKey, setLaneDropKey] = useState<string | null>(null);
  const draggingLaneRef = useRef<string | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [filters, setFilters] = useState<KanbanFilters>(EMPTY_KANBAN_FILTERS);
  const [filtersBoardId, setFiltersBoardId] = useState<string | null>(null);
  const [dashboardCopied, setDashboardCopied] = useState(false);
  const [dashboardShareUrl, setDashboardShareUrl] = useState('');
  const [laneRenameKey, setLaneRenameKey] = useState<string | null>(null);
  const [laneRenameDraft, setLaneRenameDraft] = useState('');
  const laneRenameCommit = useRef(false);
  const laneRenameCancel = useRef(false);
  const [laneDeleteKey, setLaneDeleteKey] = useState<string | null>(null);
  const [addingLane, setAddingLane] = useState(false);
  const [newLaneName, setNewLaneName] = useState('');

  async function refreshBoard() {
    setBoard(hydrateBoard(await getProjectBoard(projectId)));
  }

  useEffect(() => {
    let active = true;

    getProjectBoard(projectId)
      .then((next) => {
        if (active) {
          setBoard(hydrateBoard(next));
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(projectErrorMessage(caught));
        }
      });
    listUsers()
      .then((items) => {
        if (active) {
          setUsers(items);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(projectErrorMessage(caught));
        }
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  const queryCardId = board ? new URLSearchParams(window.location.search).get('card') : null;
  const queryCardVisible = Boolean(
    queryCardId &&
    queryCardId !== dismissedQueryId &&
    board?.lanes.some((lane) => lane.cards.some((card) => card.id === queryCardId)),
  );
  const activeCardId = selectedId ?? (queryCardVisible ? queryCardId : null);

  if (board && filtersBoardId !== board.id) {
    setFiltersBoardId(board.id);
    setFilters(board.kanbanFilters ?? EMPTY_KANBAN_FILTERS);
  }

  const selected = useMemo(() => {
    if (!board || !activeCardId) {
      return null;
    }

    return (
      board.lanes.flatMap((lane) => lane.cards).find((card) => card.id === activeCardId) ?? null
    );
  }, [activeCardId, board]);

  const cardDraftAssigneeId =
    cardDraft?.kind === 'edit'
      ? (cardDraft.card.assigneeUserId ?? undefined)
      : undefined;
  const cardFormAssignees = board?.tenantId
    ? filterCardAssigneeCandidates(users, board.tenantId, cardDraftAssigneeId)
    : [];
  const cardDetailAssignees =
    board?.tenantId && selected
      ? filterCardAssigneeCandidates(
          users,
          board.tenantId,
          selected.assigneeUserId ?? undefined,
        )
      : [];

  async function run(action: () => Promise<void>, problem: ProjectErrorKind = false) {
    setError('');
    setStatus('');

    try {
      await action();
      setStatus(PROJECT_COPY.success);
    } catch (caught) {
      setError(projectErrorMessage(caught, problem));
    }
  }

  async function persistPlace(cardId: string, lane: string, position: number) {
    try {
      await placeProjectCard(cardId, lane, position);
      await refreshBoard();
      setStatus(PROJECT_COPY.success);
      setError('');
    } catch (caught) {
      setError(projectErrorMessage(caught));
      await refreshBoard().catch(() => undefined);
    }
  }

  function laneInputs(
    overrides?: { key: string; label: string }[],
    extraLabel?: string,
    omitKey?: string,
  ) {
    const lanes: { key?: string; label: string }[] = (board?.lanes ?? [])
      .filter((lane) => lane.key !== omitKey)
      .map((lane) => {
        const replacement = overrides?.find((item) => item.key === lane.key);
        return {
          key: lane.key,
          label: replacement?.label ?? lanePresentation(lane).label,
        };
      });

    if (extraLabel) {
      lanes.push({ label: extraLabel });
    }

    return lanes;
  }

  function isLaneDrag(event: DragEvent<HTMLElement>) {
    return (
      Boolean(draggingLaneRef.current) ||
      Array.from(event.dataTransfer.types ?? []).includes('text/x-kanban-lane')
    );
  }

  function reorderLane(sourceKey: string, targetKey: string) {
    if (!board || sourceKey === targetKey) {
      return;
    }

    const lanes = [...board.lanes];
    const from = lanes.findIndex((lane) => lane.key === sourceKey);
    const to = lanes.findIndex((lane) => lane.key === targetKey);
    if (from < 0 || to < 0) {
      return;
    }

    const [moved] = lanes.splice(from, 1);
    lanes.splice(to, 0, moved);
    setBoard({ ...board, lanes });
    void (async () => {
      try {
        await updateProjectKanbanLanes(
          projectId,
          lanes.map((lane) => ({
            key: lane.key,
            label: lanePresentation(lane).label,
          })),
        );
        setStatus(PROJECT_COPY.success);
        setError('');
      } catch (caught) {
        setStatus('');
        setError(projectErrorMessage(caught));
        await refreshBoard().catch(() => undefined);
      }
    })();
  }

  function applyFilters(next: KanbanFilters) {
    setFilters(next);
    if (!canPersistFilters || !kanbanFiltersArePersistable(next)) {
      return;
    }

    void run(async () => {
      await updateProjectKanbanFilters(projectId, next);
    });
  }

  async function copyDashboardLink() {
    const url = `${window.location.origin}/portal/projetos/${projectId}`;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('clipboard');
      }

      await navigator.clipboard.writeText(url);
      setDashboardShareUrl('');
      setDashboardCopied(true);
    } catch {
      setDashboardCopied(false);
      setStatus('');
      setDashboardShareUrl(url);
    }
  }

  function closeDetail() {
    const params = new URLSearchParams(window.location.search);
    const current = params.get('card');
    if (current) {
      setDismissedQueryId(current);
      params.delete('card');
      const query = params.toString();
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
      );
    }

    setSelectedId(null);
    setCommentDraft('');
  }

  if (!board) {
    return error ? (
      <p role="status" className="text-sm text-red-500">
        {error}
      </p>
    ) : (
      <p role="status" className="sr-only">
        {PROJECT_COPY.title}
      </p>
    );
  }

  const backgroundStyle = board.backgroundUrl
    ? {
        backgroundImage: `url(${projectBackgroundSrc(board.backgroundUrl)})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }
    : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="min-w-0 text-2xl font-semibold tracking-[-0.03em] text-navy dark:text-white">
          {board.name}
        </h2>
        <div
          aria-label={PROJECT_COPY.boardActions}
          className="flex flex-wrap items-center gap-2"
          role="toolbar"
        >
          <KanbanButton
            icon={<ShareNetworkIcon className="size-5" />}
            iconPosition="start"
            variant="outline"
            onClick={() => void copyDashboardLink()}
          >
            {PROJECT_COPY.shareDashboard}
          </KanbanButton>
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-bold text-[#1e293b] dark:border-white/20 dark:bg-navy-100 dark:text-white">
            <UploadIcon className="size-5" />
            {PROJECT_COPY.uploadDashboardFile}
            <input
              type="file"
              accept={PROJECT_FILE_ACCEPT}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) {
                  return;
                }

                if (!isAllowedProjectFile(file)) {
                  setStatus('');
                  setError(PROJECT_COPY.invalidFile);
                  return;
                }

                void run(async () => {
                  await uploadProjectDocuments(projectId, [file], null, [file.name]);
                  await refreshBoard();
                  setFilesOpen(true);
                }, 'file');
              }}
            />
          </label>
          {canUseBoard ? (
            <button
              type="button"
              onClick={() => setCardDraft({ kind: 'create' })}
              className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-navy sm:py-3"
            >
              <PlusIcon className="size-4" />
              {PROJECT_COPY.newCard}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setFilesOpen((current) => !current)}
            className="min-h-10 rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold dark:border-white/20 dark:text-white"
          >
            {PROJECT_COPY.projectFiles}
          </button>
          {canBackground ? (
            <>
              <label className="inline-flex min-h-10 items-center rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold dark:border-white/20 dark:text-white">
                {PROJECT_COPY.setBoardBackground}
                <input
                  type="file"
                  accept={BACKGROUND_FILE_ACCEPT}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) {
                      return;
                    }

                    if (!isAllowedBackgroundFile(file)) {
                      setStatus('');
                      setError(PROJECT_COPY.invalidBackground);
                      return;
                    }

                    void run(async () => {
                      await putProjectBackground(projectId, file);
                      await refreshBoard();
                    }, 'background');
                  }}
                />
              </label>
              {board.backgroundUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    void run(async () => {
                      await deleteProjectBackground(projectId);
                      await refreshBoard();
                    })
                  }
                  className="min-h-10 rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold dark:border-white/20 dark:text-white"
                >
                  {PROJECT_COPY.removeBackground}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </header>
      {dashboardCopied ? (
        <p aria-live="polite" className="text-sm font-medium text-[#4f46e5]" role="status">
          {PROJECT_COPY.linkCopied}
        </p>
      ) : null}
      {dashboardShareUrl ? (
        <label className="block text-sm font-medium text-navy dark:text-white">
          {PROJECT_COPY.dashboardLink}
          <input
            readOnly
            value={dashboardShareUrl}
            className="mt-1 w-full rounded-full border border-navy/15 px-3 py-2 dark:border-white/20 dark:bg-navy-50"
          />
        </label>
      ) : null}
      <ProjectBoardFilters
        filters={filters}
        lanes={board.lanes.map((lane) => ({
          key: lane.key,
          label: lanePresentation(lane).label,
        }))}
        onChange={applyFilters}
      />
      {cardDraft ? (
        <Modal
          labelledBy="project-card-form-title"
          open
          showClose={false}
          tone="light"
          onClose={() => setCardDraft(null)}
        >
          <h2 id="project-card-form-title" className="text-xl font-semibold text-navy">
            {cardDraft.kind === 'edit' ? PROJECT_COPY.edit : PROJECT_COPY.newCard}
          </h2>
          <div className="mt-4">
            <CardForm
              assignees={cardFormAssignees}
              card={cardDraft.kind === 'edit' ? cardDraft.card : undefined}
              includeComposer
              onCancel={() => setCardDraft(null)}
              onSubmit={(payload) =>
                void run(
                  async () => {
                    const { checklistItems, files, ...cardPayload } = payload;
                    if (cardDraft.kind === 'edit') {
                      const current = cardDraft.card;
                      await updateProjectCard(current.id, cardPayload);
                      const keptIds = new Set(
                        checklistItems.flatMap((item) => (item.id ? [item.id] : [])),
                      );
                      for (const item of current.checklistItems) {
                        if (!keptIds.has(item.id)) {
                          await deleteChecklistItem(current.id, item.id);
                        }
                      }
                      for (const item of checklistItems) {
                        if (!item.id) {
                          await createChecklistItem(current.id, item.body);
                        }
                      }
                      for (const file of files) {
                        await addCardAttachment(current.id, file);
                      }
                    } else {
                      const created = await createProjectCard(projectId, cardPayload);
                      for (const item of checklistItems) {
                        await createChecklistItem(created.id, item.body);
                      }
                      for (const file of files) {
                        await addCardAttachment(created.id, file);
                      }
                    }
                    setCardDraft(null);
                    await refreshBoard();
                  },
                  payload.files.length > 0 ? 'file' : false,
                )
              }
            />
          </div>
        </Modal>
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:flex-row">
        <motion.div
          data-entrance={reducedMotion ? 'static' : 'stagger'}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.4, ease: BOARD_EASE }}
          aria-label={PROJECT_COPY.boardColumns}
          role="region"
          style={backgroundStyle}
          className={`relative min-h-[50svh] min-w-0 flex-1 overflow-hidden md:min-h-0 ${
            board.backgroundUrl ? 'rounded-[20px] bg-navy sm:rounded-[28px]' : ''
          }`}
        >
          <KanbanScope className="absolute inset-0 flex gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x p-3 pb-6 sm:gap-4 sm:p-4 sm:pb-10">
            {board.lanes.map((lane, laneIndex) => {
              const presented = lanePresentation(lane);
              const laneLabel = presented.label;
              const laneColor = presented.color;
              const laneIsEmpty = lane.cards.length === 0;
              const visibleCards = lane.cards.filter((card) =>
                cardMatchesKanbanFilters(card, filters),
              );
              return (
                <motion.section
                  key={lane.key}
                  initial={reducedMotion ? false : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: reducedMotion ? 0 : laneIndex * 0.07,
                    duration: reducedMotion ? 0 : 0.45,
                    ease: BOARD_EASE,
                  }}
                  aria-dropeffect={draggingId ? 'move' : undefined}
                  onDragOver={(event) => {
                    if (isLaneDrag(event)) {
                      if (!canPersistFilters) {
                        return;
                      }

                      event.preventDefault();
                      setLaneDropKey(lane.key);
                      return;
                    }

                    if (!canMove) {
                      return;
                    }

                    event.preventDefault();
                    setDropLane(lane.key);
                  }}
                  onDrop={(event) => {
                    if (isLaneDrag(event)) {
                      event.preventDefault();
                      const source = draggingLaneRef.current;
                      draggingLaneRef.current = null;
                      setDraggingLaneKey(null);
                      setLaneDropKey(null);
                      if (canPersistFilters && source) {
                        reorderLane(source, lane.key);
                      }
                      return;
                    }

                    if (!canMove) {
                      return;
                    }

                    event.preventDefault();
                    setDropLane(null);
                    setDraggingId(null);
                    const cardId = event.dataTransfer.getData('text/plain');
                    if (!cardId) {
                      return;
                    }

                    void persistPlace(cardId, lane.key, lane.cards.length);
                  }}
                  className={`flex h-full w-[min(18.5rem,calc(100vw-4.5rem))] min-w-[min(18.5rem,calc(100vw-4.5rem))] flex-col gap-3 overflow-y-auto overscroll-y-contain touch-pan-y md:w-[300px] md:min-w-[300px] ${
                    dropLane === lane.key || laneDropKey === lane.key
                      ? 'rounded-[24px] ring-2 ring-accent'
                      : ''
                  } ${draggingLaneKey === lane.key ? 'opacity-60' : ''}`}
                >
                  <KanbanLaneHeader
                    addLabel={canUseBoard ? addCardLaneLabel(laneLabel) : undefined}
                    count={visibleCards.length}
                    dotColor={laneColor}
                    draggable={canPersistFilters && laneRenameKey !== lane.key}
                    ink={lanePillInk(laneColor)}
                    onDragEnd={() => {
                      draggingLaneRef.current = null;
                      setDraggingLaneKey(null);
                      setLaneDropKey(null);
                    }}
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/x-kanban-lane', lane.key);
                      event.dataTransfer.effectAllowed = 'move';
                      draggingLaneRef.current = lane.key;
                      setDraggingLaneKey(lane.key);
                      setLaneDeleteKey(null);
                    }}
                    removeLabel={
                      canDeleteLane && laneIsEmpty && board.lanes.length > 1
                        ? PROJECT_COPY.deleteLane
                        : undefined
                    }
                    title={laneLabel}
                    titleSlot={
                      canRenameLane && laneIsEmpty ? (
                        laneRenameKey === lane.key ? (
                          <form
                            className="block w-full"
                            onSubmit={(event) => {
                              event.preventDefault();
                              if (laneRenameCancel.current) {
                                laneRenameCancel.current = false;
                                return;
                              }
                              const label = laneRenameDraft.trim();
                              if (!label || label === laneLabel) {
                                setLaneRenameKey(null);
                                return;
                              }
                              if (laneRenameCommit.current) {
                                return;
                              }
                              laneRenameCommit.current = true;
                              void run(async () => {
                                try {
                                  await updateProjectKanbanLanes(
                                    projectId,
                                    laneInputs([{ key: lane.key, label }]),
                                  );
                                  setLaneRenameKey(null);
                                  await refreshBoard();
                                } finally {
                                  laneRenameCommit.current = false;
                                }
                              });
                            }}
                          >
                            <input
                              required
                              autoFocus
                              maxLength={40}
                              aria-label={PROJECT_COPY.laneName}
                              value={laneRenameDraft}
                              onBlur={(event) => {
                                if (laneRenameCancel.current) {
                                  return;
                                }
                                event.currentTarget.form?.requestSubmit();
                              }}
                              onChange={(event) => setLaneRenameDraft(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                  event.preventDefault();
                                  laneRenameCancel.current = true;
                                  setLaneRenameKey(null);
                                }
                              }}
                              className="w-full bg-transparent text-base font-semibold text-current outline-none"
                            />
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setLaneDeleteKey(null);
                              setLaneRenameKey(lane.key);
                              setLaneRenameDraft(laneLabel);
                            }}
                            className="block w-full truncate text-left"
                          >
                            {laneLabel}
                          </button>
                        )
                      ) : undefined
                    }
                    variant="pill"
                    onAdd={canUseBoard ? () => setCardDraft({ kind: 'create' }) : undefined}
                    onRemove={
                      canDeleteLane && laneIsEmpty && board.lanes.length > 1
                        ? () => {
                            setLaneRenameKey(null);
                            setLaneDeleteKey(lane.key);
                          }
                        : undefined
                    }
                  />
                  {canDeleteLane && laneIsEmpty && laneDeleteKey === lane.key ? (
                    <div className="flex flex-wrap items-center gap-2 px-1">
                      <p className="text-xs font-medium text-[#1e293b]">
                        {PROJECT_COPY.confirmDeleteLane}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          void run(async () => {
                            await updateProjectKanbanLanes(
                              projectId,
                              laneInputs(undefined, undefined, lane.key),
                            );
                            setLaneDeleteKey(null);
                            await refreshBoard();
                          })
                        }
                        className="min-h-10 rounded-full bg-accent px-3 text-xs font-semibold text-navy"
                      >
                        {PROJECT_COPY.delete}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLaneDeleteKey(null)}
                        className="min-h-10 rounded-full border border-[#cbd5e1] px-3 text-xs font-semibold text-[#1e293b]"
                      >
                        {PROJECT_COPY.cancel}
                      </button>
                    </div>
                  ) : null}
                  {visibleCards.length === 0 ? (
                    <p className="px-2 text-sm text-[#64748b]">{PROJECT_COPY.emptyLane}</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {visibleCards.map((card, cardIndex) => (
                        <li key={card.id}>
                          <BoardCard
                            canMove={canMove}
                            card={card}
                            dragging={draggingId === card.id}
                            pending={pendingCardId === card.id}
                            projectId={projectId}
                            reducedMotion={Boolean(reducedMotion)}
                            staggerIndex={cardIndex}
                            onDelete={() => setPendingCardId(card.id)}
                            onDeleteCancel={() => setPendingCardId(null)}
                            onDeleteConfirm={() =>
                              void run(async () => {
                                await deleteProjectCard(card.id);
                                setPendingCardId(null);
                                if (selectedId === card.id) {
                                  setSelectedId(null);
                                }
                                await refreshBoard();
                              })
                            }
                            onDragEnd={() => {
                              setDraggingId(null);
                              setDropLane(null);
                            }}
                            onDragStart={(event) => {
                              event.dataTransfer.setData('text/plain', card.id);
                              event.dataTransfer.effectAllowed = 'move';
                              setDraggingId(card.id);
                            }}
                            onDropBefore={() => {
                              const dragged = draggingId;
                              setDraggingId(null);
                              setDropLane(null);
                              if (!dragged || dragged === card.id) {
                                return;
                              }

                              const fromIndex = lane.cards.findIndex((item) => item.id === dragged);
                              const targetIndex = lane.cards.findIndex(
                                (item) => item.id === card.id,
                              );
                              const target =
                                fromIndex >= 0 && fromIndex < targetIndex
                                  ? targetIndex - 1
                                  : targetIndex;
                              void persistPlace(dragged, lane.key, target);
                            }}
                            onEdit={() => setCardDraft({ kind: 'edit', card })}
                            onOpen={() => setSelectedId(card.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.section>
              );
            })}
            {canCreateLane && board.lanes.length < 12 ? (
              <section className="flex h-full w-[min(18.5rem,calc(100vw-4.5rem))] min-w-[min(18.5rem,calc(100vw-4.5rem))] flex-col md:w-[300px] md:min-w-[300px]">
                {addingLane ? (
                  <form
                    className="flex flex-col gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const label = newLaneName.trim();
                      if (!label) {
                        return;
                      }

                      void run(async () => {
                        await updateProjectKanbanLanes(projectId, laneInputs(undefined, label));
                        setAddingLane(false);
                        setNewLaneName('');
                        await refreshBoard();
                      });
                    }}
                  >
                    <label className="text-sm font-medium text-[#1e293b]">
                      {PROJECT_COPY.laneName}
                      <input
                        required
                        maxLength={40}
                        value={newLaneName}
                        onChange={(event) => setNewLaneName(event.target.value)}
                        className="mt-1 min-h-10 w-full rounded-full border border-[#cbd5e1] bg-white px-3 text-sm"
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="min-h-10 rounded-full bg-accent px-4 text-sm font-semibold text-navy"
                      >
                        {PROJECT_COPY.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingLane(false);
                          setNewLaneName('');
                        }}
                        className="min-h-10 rounded-full border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-[#1e293b]"
                      >
                        {PROJECT_COPY.cancel}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingLane(true)}
                    className="min-h-12 rounded-full border border-dashed border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-[#1e293b]"
                  >
                    {PROJECT_COPY.newLane}
                  </button>
                )}
              </section>
            ) : null}
          </KanbanScope>
        </motion.div>
        {filesOpen ? (
          <ProjectFilesPanel
            board={board}
            onClientError={(message) => {
              setStatus('');
              setError(message);
            }}
            onClose={() => setFilesOpen(false)}
            onReload={refreshBoard}
            onRun={run}
          />
        ) : null}
      </div>
      {selected ? (
        <Modal labelledBy="project-card-detail-title" open onClose={closeDetail} tone="light">
          <CardDetail
            assignees={cardDetailAssignees}
            card={selected}
            commentDraft={commentDraft}
            onClose={closeDetail}
            onCommentChange={setCommentDraft}
            onFileRejected={() => {
              setStatus('');
              setError(PROJECT_COPY.invalidFile);
            }}
            onReload={refreshBoard}
            onRun={run}
          />
        </Modal>
      ) : null}
      {error ? (
        <p role="status" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}
      {status ? (
        <p role="status" className="text-sm text-text-dark-secondary dark:text-text-secondary">
          {status}
        </p>
      ) : null}
    </div>
  );
}

function lanePillInk(color: string): 'dark' | 'light' {
  const match = /^#([0-9a-f]{6})$/i.exec(color);

  if (!match) {
    return 'light';
  }

  const hex = match[1];
  const channel = (offset: number) => Number.parseInt(hex.slice(offset, offset + 2), 16);
  const luminance = (0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)) / 255;

  return luminance >= 0.62 ? 'dark' : 'light';
}

function priorityFaceClass(priority: string): string {
  if (priority === 'high') {
    return 'text-[#ef4444]';
  }

  if (priority === 'low') {
    return 'text-[#3d9cf0]';
  }

  return 'text-[#f5a524]';
}

function BoardCard({
  canMove,
  card,
  dragging,
  pending,
  projectId,
  reducedMotion,
  staggerIndex,
  onDelete,
  onDeleteCancel,
  onDeleteConfirm,
  onDragEnd,
  onDragStart,
  onDropBefore,
  onEdit,
  onOpen,
}: {
  canMove: boolean;
  card: ProjectCard;
  dragging: boolean;
  pending: boolean;
  projectId: string;
  reducedMotion: boolean;
  staggerIndex: number;
  onDelete: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
  onDragEnd: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDropBefore: () => void;
  onEdit: () => void;
  onOpen: () => void;
}) {
  const cover = card.attachments.find((file) => file.id === card.coverAttachmentId);
  const due = card.dueAt ? dueUrgency(card.dueAt) : null;
  const photo = card.assigneePhotoUrl ? publicPhotoSrc(card.assigneePhotoUrl) : '';
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  async function copyCardLink() {
    const url = `${window.location.origin}/portal/projetos/${projectId}?card=${card.id}`;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('clipboard');
      }

      await navigator.clipboard.writeText(url);
      setShareUrl('');
      setCopied(true);
    } catch {
      setCopied(false);
      setShareUrl(url);
    }
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        rotate: dragging && !reducedMotion ? 2 : 0,
        y: 0,
      }}
      transition={{
        delay: reducedMotion ? 0 : staggerIndex * 0.02,
        duration: reducedMotion ? 0 : 0.35,
        ease: BOARD_EASE,
      }}
    >
      <article
        draggable={canMove}
        aria-grabbed={canMove ? dragging : undefined}
        onDragStart={
          canMove
            ? (event) => {
                const fromAction = event.nativeEvent
                  .composedPath()
                  .some(
                    (node) => node instanceof HTMLElement && node.dataset.cardAction === 'true',
                  );
                if (fromAction) {
                  event.preventDefault();
                  return;
                }

                onDragStart(event);
              }
            : undefined
        }
        onDragEnd={canMove ? onDragEnd : undefined}
        onDragOver={
          canMove
            ? (event) => {
                event.preventDefault();
                event.stopPropagation();
              }
            : undefined
        }
        onDrop={
          canMove
            ? (event) => {
                event.preventDefault();
                event.stopPropagation();
                onDropBefore();
              }
            : undefined
        }
        className={`overflow-hidden rounded-[24px] border border-[#e8edf5] bg-white p-4 shadow-[0px_8px_24px_-12px_rgba(15,23,42,0.28)] ${
          dragging ? 'shadow-lg' : ''
        }`}
      >
        {cover && IMAGE_PROJECT_FILE_TYPES.has(cover.contentType) ? (
          <img
            alt=""
            src={cardAttachmentSrc(cover.url)}
            className="mb-3 h-28 w-full rounded-[16px] object-cover"
          />
        ) : null}
        <button
          type="button"
          onClick={onOpen}
          className="mt-2 flex w-full min-w-0 items-baseline gap-2 text-left"
        >
          <span className="shrink-0 text-base font-semibold text-[#1e293b]">#{card.number}</span>
          <span className="min-w-0 text-base font-semibold break-words text-[#1e293b]">
            {card.title}
          </span>
        </button>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="sr-only">{PROJECT_COPY.associated}:</span>
            {photo ? (
              <KanbanAvatar alt="" src={photo} />
            ) : card.assigneeUserId ? (
              <span className="flex size-8 items-center justify-center rounded-full bg-board-lane-ready text-xs font-semibold text-white">
                {assigneeInitials(card.assigneeFirstName, card.assigneeLastName)}
              </span>
            ) : null}
          </span>
          <span className="flex shrink-0 items-center gap-3 text-xs font-medium text-[#64748b]">
            {due && card.dueAt ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${DUE_URGENCY_CLASS[due]}`}
              >
                <span className="sr-only">{PROJECT_COPY.dateTime}:</span>
                <ClockIcon />
                {formatDueAt(card.dueAt)}
              </span>
            ) : null}
            {card.comments.length > 0 ? (
              <span className="inline-flex items-center gap-1">
                <span className="sr-only">{PROJECT_COPY.comments}:</span>
                <ChatTeardropDotsIcon className="size-4" />
                {card.comments.length}
              </span>
            ) : null}
            {card.attachments.length > 0 ? (
              <span className="inline-flex items-center gap-1">
                <span className="sr-only">{PROJECT_COPY.attachments}:</span>
                <PaperclipIcon className="size-4" />
                {card.attachments.length}
              </span>
            ) : null}
            <span
              className={`inline-flex items-center font-semibold ${priorityFaceClass(card.priority)}`}
            >
              <span className="sr-only">{PROJECT_COPY.priority}:</span>
              {CARD_PRIORITIES.find((item) => item.key === card.priority)?.label ?? card.priority}
            </span>
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-card-action="true"
            onClick={onEdit}
            onMouseDown={(event) => event.stopPropagation()}
            className="min-h-10 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-navy"
          >
            {PROJECT_COPY.edit}
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              data-card-action="true"
              onClick={onDelete}
              onMouseDown={(event) => event.stopPropagation()}
              className="min-h-10 rounded-full border border-[#cbd5e1] px-4 py-2 text-xs font-semibold text-[#1e293b]"
            >
              {PROJECT_COPY.delete}
            </button>
            <button
              type="button"
              data-card-action="true"
              onClick={() => void copyCardLink()}
              onMouseDown={(event) => event.stopPropagation()}
              className={`inline-flex min-h-10 items-center justify-center rounded-full border border-[#cbd5e1] px-4 py-2 text-xs font-semibold whitespace-nowrap text-[#1e293b] ${focusRing}`}
            >
              Compartilhar
            </button>
          </div>
        </div>
        {copied ? (
          <p aria-live="polite" className="mt-2 text-sm font-medium text-[#4f46e5]">
            Link copiado.
          </p>
        ) : null}
        {shareUrl ? (
          <label className="mt-2 block text-sm font-medium text-[#475569]">
            Link do card
            <input
              readOnly
              value={shareUrl}
              className="mt-1 w-full rounded-full border border-[#cbd5e1] px-3 py-2"
            />
          </label>
        ) : null}
        {pending ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-[#1e293b]">{PROJECT_COPY.confirmDeleteCard}</p>
            <div className="flex gap-2">
              <button
                type="button"
                data-card-action="true"
                onClick={onDeleteConfirm}
                onMouseDown={(event) => event.stopPropagation()}
                className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-navy"
              >
                {PROJECT_COPY.delete}
              </button>
              <button
                type="button"
                data-card-action="true"
                onClick={onDeleteCancel}
                onMouseDown={(event) => event.stopPropagation()}
                className="rounded-full border border-[#cbd5e1] px-3 py-1 text-xs font-semibold text-[#1e293b]"
              >
                {PROJECT_COPY.cancel}
              </button>
            </div>
          </div>
        ) : null}
      </article>
    </motion.div>
  );
}

function CardForm({
  assignees,
  card,
  includeComposer = false,
  onCancel,
  onSubmit,
}: {
  assignees: UserListItem[];
  card?: ProjectCard;
  includeComposer?: boolean;
  onCancel: () => void;
  onSubmit: (payload: {
    assigneeUserId: string;
    checklistItems: DraftChecklistItem[];
    description: string;
    dueAt?: string | null;
    files: File[];
    priority?: string;
    startsAt?: string | null;
    title: string;
  }) => void;
}) {
  const [title, setTitle] = useState(card?.title ?? '');
  const [description, setDescription] = useState(card?.description ?? '');
  const [assigneeUserId, setAssigneeUserId] = useState(card?.assigneeUserId ?? '');
  const [startsAt, setStartsAt] = useState(dateInputFromDueAt(card?.startsAt ?? null));
  const [dueAt, setDueAt] = useState(dateInputFromDueAt(card?.dueAt ?? null));
  const [priority, setPriority] = useState(card?.priority ?? 'medium');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const [dateError, setDateError] = useState('');
  const [checklistDraft, setChecklistDraft] = useState('');
  const [checklistItems, setChecklistItems] = useState<DraftChecklistItem[]>(() =>
    includeComposer && card
      ? card.checklistItems.map((item) => ({ body: item.body, id: item.id }))
      : [],
  );

  function handleFiles(list: FileList | null) {
    const selected = cardAttachmentsToUpload(list ?? [], card?.attachments.length ?? 0);
    if (!selected) {
      setFiles([]);
      setFileError(PROJECT_COPY.invalidFile);
      return;
    }

    setFileError('');
    setFiles(selected);
  }

  function addChecklistItem() {
    const body = checklistDraft.trim();
    if (!body || checklistItems.length >= 50) {
      return;
    }

    setChecklistItems((current) => [...current, { body }]);
    setChecklistDraft('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fileError) {
      return;
    }

    if (startsAt && dueAt && startsAt > dueAt) {
      setDateError(PROJECT_COPY.dateRangeInvalid);
      return;
    }

    onSubmit({
      assigneeUserId,
      checklistItems,
      description: description.trim(),
      dueAt: dueAt ? dueAtFromDateInput(dueAt) : null,
      files,
      priority,
      startsAt: startsAt ? dueAtFromDateInput(startsAt) : null,
      title: title.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid min-w-0 gap-4 rounded-[24px] border border-navy/10 bg-white p-4 md:grid-cols-2 md:p-5"
    >
      <label className="block text-sm font-medium text-navy">
        {PROJECT_COPY.cardTitle}
        <input
          required
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium text-navy">
        {PROJECT_COPY.associated}
        <select
          required
          value={assigneeUserId}
          onChange={(event) => setAssigneeUserId(event.target.value)}
          className={fieldClass}
        >
          <option value="" />
          {assignees.map((item) => (
            <option key={item.id} value={item.id}>
              {item.firstName} {item.lastName}
            </option>
          ))}
        </select>
      </label>
      <label className="md:col-span-2 block text-sm font-medium text-navy">
        {PROJECT_COPY.description}
        <textarea
          required
          maxLength={10000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={`${fieldClass} min-h-24`}
        />
      </label>
      {includeComposer ? (
        <div className="md:col-span-2">
          <label
            htmlFor="new-card-checklist"
            className="block text-sm font-medium text-navy"
          >
            {PROJECT_COPY.checklist}
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="new-card-checklist"
              maxLength={200}
              value={checklistDraft}
              onChange={(event) => setChecklistDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') {
                  return;
                }

                event.preventDefault();
                addChecklistItem();
              }}
              className="min-w-0 flex-1 rounded-2xl border border-navy/10 bg-white px-3 py-2 text-sm text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={addChecklistItem}
              className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-navy"
            >
              {PROJECT_COPY.newChecklistItem}
            </button>
          </div>
          {checklistItems.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {checklistItems.map((item, index) => (
                <li key={item.id ?? `${index}-${item.body}`} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 text-sm text-navy">{item.body}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setChecklistItems((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="shrink-0 rounded-full border border-[#cbd5e1] px-3 py-1 text-xs font-semibold text-[#1e293b]"
                  >
                    {PROJECT_COPY.delete}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <label className="block text-sm font-medium text-navy">
        {PROJECT_COPY.startDate}
        <input
          type="date"
          value={startsAt}
          onChange={(event) => {
            setStartsAt(event.target.value);
            setDateError('');
          }}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium text-navy">
        {PROJECT_COPY.endDate}
        <input
          type="date"
          value={dueAt}
          onChange={(event) => {
            setDueAt(event.target.value);
            setDateError('');
          }}
          className={fieldClass}
        />
      </label>
      {dateError ? <p className="text-xs text-[#f43f5e] md:col-span-2">{dateError}</p> : null}
      <label className="block text-sm font-medium text-navy">
        {PROJECT_COPY.priority}
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          className={fieldClass}
        >
          {CARD_PRIORITIES.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      {includeComposer ? (
        <div>
      <label
            htmlFor="new-card-attachments"
            className="block text-sm font-medium text-navy"
          >
            {PROJECT_COPY.attach}
          </label>
          <input
            id="new-card-attachments"
            type="file"
            multiple
            accept={PROJECT_FILE_ACCEPT}
            onChange={(event) => {
              handleFiles(event.target.files);
              event.target.value = '';
            }}
            className={fieldClass}
          />
          {files.length > 0 ? (
            <p className="mt-2 text-xs text-[#64748b]">
              {files.map((file) => file.name).join(', ')}
            </p>
          ) : null}
          <p className={`mt-2 text-xs ${fileError ? 'text-[#f43f5e]' : 'text-[#64748b]'}`}>
            {fileError || PROJECT_COPY.attachmentFileLimit}
          </p>
        </div>
      ) : null}
      <div className="flex gap-3 md:col-span-2">
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-navy"
        >
          {PROJECT_COPY.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-navy"
        >
          {PROJECT_COPY.cancel}
        </button>
      </div>
    </form>
  );
}

function CardMetaField({
  children,
  label,
  tone = 'modal',
}: {
  children: ReactNode;
  label: string;
  tone?: 'face' | 'modal';
}) {
  return (
    <div className={tone === 'face' ? 'text-xs text-[#475569]' : 'text-sm text-text-dark-secondary'}>
      <dt className="inline">{label}:</dt> <dd className="inline">{children}</dd>
    </div>
  );
}

function CardDetail({
  assignees,
  card,
  commentDraft,
  onClose,
  onCommentChange,
  onFileRejected,
  onReload,
  onRun,
}: {
  assignees: UserListItem[];
  card: ProjectCard;
  commentDraft: string;
  onClose: () => void;
  onCommentChange: (value: string) => void;
  onFileRejected: () => void;
  onReload: () => Promise<void>;
  onRun: (action: () => Promise<void>, problem?: ProjectErrorKind) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [commentEdits, setCommentEdits] = useState<Record<string, string>>({});
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [checklistDraft, setChecklistDraft] = useState('');
  const [itemDraft, setItemDraft] = useState('');

  return (
    <div className="pr-10 text-navy">
      <div className="flex flex-wrap items-baseline gap-2">
        <p className="text-xl font-semibold text-navy">#{card.number}</p>
        <h2 id="project-card-detail-title" className="text-xl font-semibold text-navy">
          {card.title}
        </h2>
      </div>
      <section className="mt-4 rounded-2xl border border-navy/10 bg-off-white p-4">
        <h3 className="text-sm font-semibold text-navy">{PROJECT_COPY.request}</h3>
        {card.createdAt ? (
          <time dateTime={card.createdAt} className="mt-1 block text-xs text-text-dark-secondary">
            {formatDateTime(card.createdAt)}
          </time>
        ) : null}
        <p className="mt-2 text-sm text-navy/80">{card.description}</p>
      </section>
      <dl className="mt-3 space-y-1">
        <CardMetaField label={PROJECT_COPY.created}>
          {card.createdByFirstName} {card.createdByLastName}
        </CardMetaField>
        <CardMetaField label={PROJECT_COPY.associated}>
          {card.assigneeUserId
            ? `${card.assigneeFirstName} ${card.assigneeLastName}`
            : ''}
        </CardMetaField>
        <CardMetaField label={PROJECT_COPY.startDate}>
          {card.startsAt ? formatDateTime(card.startsAt) : ''}
        </CardMetaField>
        <CardMetaField label={PROJECT_COPY.endDate}>
          {card.dueAt ? formatDateTime(card.dueAt) : ''}
        </CardMetaField>
        <CardMetaField label={PROJECT_COPY.priority}>
          {CARD_PRIORITIES.find((item) => item.key === card.priority)?.label ?? card.priority}
        </CardMetaField>
      </dl>
      {editing ? (
        <div className="mt-4">
          <CardForm
            assignees={assignees}
            card={card}
            onCancel={() => setEditing(false)}
            onSubmit={(payload) =>
              void onRun(
                async () => {
                  const { checklistItems, files, ...cardPayload } = payload;
                  void checklistItems;
                  await updateProjectCard(card.id, cardPayload);
                  for (const file of files) {
                    await addCardAttachment(card.id, file);
                  }
                  setEditing(false);
                  await onReload();
                },
                payload.files.length > 0 ? 'file' : false,
              )
            }
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-4 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-navy"
        >
          {PROJECT_COPY.edit}
        </button>
      )}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-navy">{PROJECT_COPY.checklist}</h3>
        {card.checklistItems.length === 0 ? (
          <p className="mt-2 text-sm text-text-dark-secondary">{PROJECT_COPY.emptyChecklist}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {card.checklistItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() =>
                    void onRun(async () => {
                      await updateChecklistItem(card.id, item.id, { done: !item.done });
                      await onReload();
                    })
                  }
                />
                {editingChecklistId === item.id ? (
                  <input
                    maxLength={200}
                    value={checklistDraft}
                    onChange={(event) => setChecklistDraft(event.target.value)}
                    className="min-w-0 flex-1 rounded-2xl border border-navy/10 bg-white px-3 py-2 text-sm text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  />
                ) : (
                  <span className="flex-1 text-sm text-navy">{item.body}</span>
                )}
                {editingChecklistId === item.id ? (
                  <button
                    type="button"
                    onClick={() =>
                      void onRun(async () => {
                        await updateChecklistItem(card.id, item.id, {
                          body: checklistDraft.trim(),
                        });
                        setEditingChecklistId(null);
                        setChecklistDraft('');
                        await onReload();
                      })
                    }
                    className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-navy"
                  >
                    {PROJECT_COPY.save}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingChecklistId(item.id);
                      setChecklistDraft(item.body);
                    }}
                    className={modalGhostClass}
                  >
                    {PROJECT_COPY.edit}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    void onRun(async () => {
                      await deleteChecklistItem(card.id, item.id);
                      await onReload();
                    })
                  }
                  className={modalGhostClass}
                >
                  {PROJECT_COPY.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onRun(async () => {
              await createChecklistItem(card.id, itemDraft.trim());
              setItemDraft('');
              await onReload();
            });
          }}
        >
          <input
            required
            maxLength={200}
            value={itemDraft}
            onChange={(event) => setItemDraft(event.target.value)}
            className="min-w-48 flex-1 rounded-2xl border border-navy/10 bg-white px-3 py-2 text-sm text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-navy"
          >
            {PROJECT_COPY.newChecklistItem}
          </button>
        </form>
      </div>
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-navy">{PROJECT_COPY.comments}</h3>
        {card.comments.length === 0 ? (
          <p className="mt-2 text-sm text-text-dark-secondary">{PROJECT_COPY.emptyComments}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {card.comments.map((comment) => (
              <li key={comment.id} className="rounded-2xl border border-navy/10 p-3">
                <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-text-dark-secondary">
                  <span>
                    {comment.authorFirstName} {comment.authorLastName}
                  </span>
                  <time dateTime={comment.createdAt}>{formatDateTime(comment.createdAt)}</time>
                </p>
                <textarea
                  maxLength={4000}
                  value={commentEdits[comment.id] ?? comment.body}
                  onChange={(event) =>
                    setCommentEdits((current) => ({
                      ...current,
                      [comment.id]: event.target.value,
                    }))
                  }
                  className={`${modalFieldClass} min-h-16`}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void onRun(async () => {
                        await updateCardComment(
                          card.id,
                          comment.id,
                          (commentEdits[comment.id] ?? comment.body).trim(),
                        );
                        await onReload();
                      })
                    }
                    className={modalGhostClass}
                  >
                    {PROJECT_COPY.save}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void onRun(async () => {
                        await deleteCardComment(card.id, comment.id);
                        await onReload();
                      })
                    }
                    className={modalGhostClass}
                  >
                    {PROJECT_COPY.delete}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <form
          className="mt-4 flex flex-wrap gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void onRun(async () => {
              await createCardComment(card.id, commentDraft.trim());
              onCommentChange('');
              await onReload();
            });
          }}
        >
          <input
            required
            maxLength={4000}
            value={commentDraft}
            onChange={(event) => onCommentChange(event.target.value)}
            className="min-w-64 flex-1 rounded-2xl border border-navy/10 bg-white px-3 py-2 text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-navy"
          >
            {PROJECT_COPY.comment}
          </button>
        </form>
      </div>
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-navy">{PROJECT_COPY.attachments}</h3>
        {card.attachments.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {card.attachments.map((file) => (
              <li
                key={file.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-navy/10 bg-off-white px-3 py-2"
              >
                <span className="text-navy/70">
                  <PaperclipIcon className="h-4 w-4" />
                </span>
                <a
                  href={cardAttachmentSrc(file.url)}
                  className="text-sm font-semibold text-navy underline"
                >
                  {file.originalName}
                </a>
                <span className="text-xs text-text-dark-secondary">
                  {PROJECT_COPY.uploadedBy} {file.createdByFirstName} {file.createdByLastName}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    void onRun(async () => {
                      await deleteCardAttachment(card.id, file.id);
                      await onReload();
                    })
                  }
                  className={`${modalGhostClass} ml-auto`}
                >
                  {PROJECT_COPY.delete}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <label className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-navy/20 bg-off-white px-4 py-6 text-center transition-colors hover:border-accent/60 hover:bg-white">
          <span className="text-navy/70">
            <PaperclipIcon className="h-6 w-6" />
          </span>
          <span className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-navy">
            {PROJECT_COPY.uploadFile}
          </span>
          <input
            type="file"
            multiple
            accept={PROJECT_FILE_ACCEPT}
            aria-label={PROJECT_COPY.uploadFile}
            className="sr-only"
            onChange={(event) => {
              const selected = cardAttachmentsToUpload(
                event.target.files ?? [],
                card.attachments.length,
              );
              event.target.value = '';

              if (!selected) {
                onFileRejected();
                return;
              }

              if (selected.length === 0) {
                return;
              }

              void onRun(async () => {
                for (const file of selected) {
                  await addCardAttachment(card.id, file);
                }

                await onReload();
              }, 'file');
            }}
          />
        </label>
        <p className="mt-2 text-center text-xs text-text-dark-secondary">{PROJECT_COPY.attachmentFileLimit}</p>
      </div>
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-navy"
        >
          {PROJECT_COPY.save}
        </button>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 fill-current">
      <path d="M8 1.2A6.8 6.8 0 1 0 14.8 8 6.81 6.81 0 0 0 8 1.2Zm0 12.2A5.4 5.4 0 1 1 13.4 8 5.41 5.41 0 0 1 8 13.4Zm.6-8.6H7.2v4.1l3.5 2.1.7-1.15-2.8-1.67Z" />
    </svg>
  );
}

function PaperclipIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`${className} fill-current`}>
      <path d="M10.3 3.4 4.6 9.1a2.4 2.4 0 1 0 3.4 3.4l6.2-6.2a3.7 3.7 0 0 0-5.2-5.2L2.7 7.3a5 5 0 0 0 7.1 7.1l5.1-5.1.9.9-5.1 5.1A6.2 6.2 0 0 1 1.8 6.5l6.6-6.6a4.9 4.9 0 0 1 6.9 6.9l-6.2 6.2a3.6 3.6 0 1 1-5.1-5.1l5.7-5.7Z" />
    </svg>
  );
}
