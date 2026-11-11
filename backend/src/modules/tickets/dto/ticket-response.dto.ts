import { ApiProperty } from '@nestjs/swagger';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../ticket.constants.js';

export class TicketPersonDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  displayName: string;
}

export class TicketTenantDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  displayName: string;
}

export class TicketCommentDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  ticketId: string;

  @ApiProperty({ format: 'uuid' })
  authorId: string;

  @ApiProperty({ type: TicketPersonDto })
  author: TicketPersonDto;

  @ApiProperty()
  body: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class TicketAttachmentDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  ticketId: string;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  byteSize: number;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ format: 'uuid' })
  createdByUserId: string;

  @ApiProperty()
  createdByFirstName: string;

  @ApiProperty()
  createdByLastName: string;
}

export class TicketSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  tenantId: string;

  @ApiProperty()
  tenantName: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: TICKET_CATEGORIES })
  category: string;

  @ApiProperty({ enum: TICKET_STATUSES })
  status: string;

  @ApiProperty({ enum: TICKET_PRIORITIES })
  priority: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty()
  hasNewComments: boolean;
}

export class TicketDetailDto extends TicketSummaryDto {
  @ApiProperty()
  description: string;

  @ApiProperty({ format: 'uuid' })
  openedById: string;

  @ApiProperty({ type: TicketPersonDto })
  openedBy: TicketPersonDto;

  @ApiProperty({ type: TicketTenantDto })
  tenant: TicketTenantDto;

  @ApiProperty({ type: [TicketCommentDto] })
  comments: TicketCommentDto[];

  @ApiProperty({ type: [TicketAttachmentDto] })
  attachments: TicketAttachmentDto[];
}

export class TicketMutationDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ type: TicketDetailDto })
  ticket: TicketDetailDto;
}

export class TicketCommentMutationDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ type: TicketCommentDto })
  comment: TicketCommentDto;
}

export class TicketListDto {
  @ApiProperty({ type: [TicketSummaryDto] })
  items: TicketSummaryDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;
}
