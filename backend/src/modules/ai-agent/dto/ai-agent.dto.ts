import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  MAX_MESSAGE_CHARS,
  MAX_CONVERSATION_TITLE_CHARS,
} from '../ai-agent.constants.js';
import type { RunStatus } from '../ai-agent.constants.js';

export class CreateConversationDto {}

export class ListConversationsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class CreateMessageDto {
  @ApiPropertyOptional({ maxLength: MAX_MESSAGE_CHARS })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_MESSAGE_CHARS)
  content?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 5 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID('4', { each: true })
  attachmentIds?: string[];
}

export class AiPricingDto {
  @ApiProperty({ example: 0.6 })
  tokenCostPerMillion: number;

  @ApiProperty({
    description:
      'BRL cost of the caller succeeded prompts, from input and output tokens.',
    example: 0.012,
  })
  usageCost: number;
}

export class UpdateConversationTitleDto {
  @ApiProperty({ maxLength: MAX_CONVERSATION_TITLE_CHARS, minLength: 1 })
  @IsString()
  @MaxLength(MAX_CONVERSATION_TITLE_CHARS)
  @MinLength(1)
  title: string;
}

export class AiAttachmentCreatedDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  conversationId: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  expiresAt: string;

  @ApiProperty()
  createdAt: string;
}

export class ConversationCreatedDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class ConversationSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ nullable: true })
  title: string | null;

  @ApiProperty()
  preview: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class ConversationListDto {
  @ApiProperty({ type: [ConversationSummaryDto] })
  items: ConversationSummaryDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class MessageAttachmentDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;
}

export class MessageViewDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @ApiProperty()
  content: string;

  @ApiProperty()
  sequence: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ type: [MessageAttachmentDto] })
  attachments: MessageAttachmentDto[];
}

export class RunSubmissionDto {
  @ApiProperty({ format: 'uuid' })
  runId: string;

  @ApiProperty({ format: 'uuid' })
  conversationId: string;

  @ApiProperty({ format: 'uuid' })
  messageId: string;

  @ApiProperty({ enum: ['QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED'] })
  status: RunStatus;
}

export class RunStatusDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  conversationId: string;

  @ApiProperty({ format: 'uuid' })
  messageId: string;

  @ApiProperty({ enum: ['QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED'] })
  status: RunStatus;

  @ApiProperty()
  requestedModel: string;

  @ApiProperty({ nullable: true })
  effectiveModel: string | null;

  @ApiProperty({ nullable: true })
  inputTokens: number | null;

  @ApiProperty({ nullable: true })
  outputTokens: number | null;

  @ApiProperty({ nullable: true })
  durationMs: number | null;

  @ApiProperty()
  attempt: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ nullable: true })
  startedAt: string | null;

  @ApiProperty({ nullable: true })
  completedAt: string | null;

  @ApiProperty({ nullable: true })
  errorCode: string | null;

  @ApiProperty({ nullable: true })
  errorMessage: string | null;

  @ApiProperty({ nullable: true })
  assistantMessageId: string | null;

  @ApiProperty({ nullable: true })
  assistantContent: string | null;
}
