import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { projectWorkspaceExample } from '../../../common/swagger/examples.js';
import { CardTagDto } from './card.dto.js';
import { KanbanFiltersDto } from './kanban-filters.dto.js';

export class ProjectWorkspaceDto {
  @ApiProperty({ example: projectWorkspaceExample.id })
  id: string;

  @ApiProperty({ example: projectWorkspaceExample.tenantId })
  tenantId: string;

  @ApiProperty({ example: projectWorkspaceExample.name })
  name: string;
}

export class ProjectSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  workspaceId: string;

  @ApiProperty()
  name: string;
}

export class CardCommentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  cardId: string;

  @ApiProperty()
  authorUserId: string;

  @ApiProperty()
  authorFirstName: string;

  @ApiProperty()
  authorLastName: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class CardAttachmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  cardId: string;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  byteSize: number;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  createdByUserId: string;

  @ApiProperty()
  createdByFirstName: string;

  @ApiProperty()
  createdByLastName: string;
}

export class CardChecklistItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  cardId: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  done: boolean;

  @ApiProperty()
  position: number;

  @ApiProperty()
  createdByUserId: string;
}

export class ProjectDocumentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  parentId: string | null;

  @ApiProperty({ enum: ['file', 'folder'] })
  kind: 'file' | 'folder';

  @ApiProperty()
  originalName: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  contentType: string | null;

  @ApiProperty()
  byteSize: number;

  @ApiProperty()
  createdByUserId: string;

  @ApiProperty()
  createdByFirstName: string;

  @ApiProperty()
  createdByLastName: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  url: string | null;

  @ApiProperty({ isArray: true, type: () => ProjectDocumentDto })
  children: ProjectDocumentDto[];
}

export class CardDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  number: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  createdByUserId: string;

  @ApiProperty()
  createdByFirstName: string;

  @ApiProperty()
  createdByLastName: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  assigneeUserId: string | null;

  @ApiProperty()
  assigneeFirstName: string;

  @ApiProperty()
  assigneeLastName: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  assigneePhotoUrl: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  startsAt: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  dueAt: string | null;

  @ApiProperty()
  priority: string;

  @ApiProperty()
  lane: string;

  @ApiProperty()
  position: number;

  @ApiProperty({ isArray: true, type: CardTagDto })
  tags: CardTagDto[];

  @ApiPropertyOptional({ nullable: true, type: String })
  coverAttachmentId: string | null;

  @ApiProperty({ isArray: true, type: CardCommentDto })
  comments: CardCommentDto[];

  @ApiProperty({ isArray: true, type: CardAttachmentDto })
  attachments: CardAttachmentDto[];

  @ApiProperty({ isArray: true, type: CardChecklistItemDto })
  checklistItems: CardChecklistItemDto[];
}

export class BoardLaneDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ example: '#64748B' })
  color: string;

  @ApiProperty({ isArray: true, type: CardDto })
  cards: CardDto[];
}

export class ProjectBackgroundDto {
  @ApiPropertyOptional({ nullable: true, type: String })
  backgroundUrl: string | null;
}

export class ProjectBoardDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  workspaceId: string;

  @ApiProperty({ example: projectWorkspaceExample.tenantId })
  tenantId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true, type: KanbanFiltersDto })
  kanbanFilters: KanbanFiltersDto | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  backgroundUrl: string | null;

  @ApiProperty({ isArray: true, type: BoardLaneDto })
  lanes: BoardLaneDto[];

  @ApiProperty({ isArray: true, type: ProjectDocumentDto })
  documents: ProjectDocumentDto[];
}
