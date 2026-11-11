import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  CARD_PRIORITIES,
  MAX_CHECKLIST_BODY_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
  MAX_TAG_LENGTH,
  MAX_TAGS_PER_CARD,
  MAX_TITLE_LENGTH,
  TAG_COLORS,
} from '../project-constants.js';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CardTagDto {
  @ApiProperty({ maxLength: MAX_TAG_LENGTH, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_TAG_LENGTH)
  name: string;

  @ApiProperty({ enum: TAG_COLORS })
  @IsIn(TAG_COLORS)
  color: (typeof TAG_COLORS)[number];
}

export class CreateCardDto {
  @ApiProperty({ maxLength: MAX_TITLE_LENGTH, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_TITLE_LENGTH)
  title: string;

  @ApiProperty({ maxLength: MAX_DESCRIPTION_LENGTH, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_DESCRIPTION_LENGTH)
  description: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4')
  assigneeUserId?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  startsAt?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  dueAt?: string | null;

  @ApiPropertyOptional({ enum: CARD_PRIORITIES })
  @IsOptional()
  @IsIn(CARD_PRIORITIES)
  priority?: (typeof CARD_PRIORITIES)[number];

  @ApiPropertyOptional({ isArray: true, type: CardTagDto })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TAGS_PER_CARD)
  @ValidateNested({ each: true })
  @Type(() => CardTagDto)
  tags?: CardTagDto[];
}

export class UpdateCardDto {
  @ApiPropertyOptional({ maxLength: MAX_TITLE_LENGTH, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_TITLE_LENGTH)
  title?: string;

  @ApiPropertyOptional({ maxLength: MAX_DESCRIPTION_LENGTH, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_DESCRIPTION_LENGTH)
  description?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  assigneeUserId?: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsOptional()
  @IsDateString()
  dueAt?: string | null;

  @ApiPropertyOptional({ enum: CARD_PRIORITIES })
  @IsOptional()
  @IsIn(CARD_PRIORITIES)
  priority?: (typeof CARD_PRIORITIES)[number];

  @ApiPropertyOptional({ isArray: true, type: CardTagDto })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TAGS_PER_CARD)
  @ValidateNested({ each: true })
  @Type(() => CardTagDto)
  tags?: CardTagDto[];

  @ApiPropertyOptional({ nullable: true, type: String })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsOptional()
  @IsUUID('4')
  coverAttachmentId?: string | null;
}

export class MoveCardDto {
  @ApiProperty({ example: 'ready', pattern: '^[a-z0-9-]{1,20}$' })
  @Matches(/^[a-z0-9-]{1,20}$/)
  lane: string;
}

export class PlaceCardDto {
  @ApiProperty({ example: 'ready', pattern: '^[a-z0-9-]{1,20}$' })
  @Matches(/^[a-z0-9-]{1,20}$/)
  lane: string;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position: number;
}

export class ReorderCardDto {
  @ApiProperty({ enum: ['up', 'down'] })
  @IsIn(['up', 'down'])
  direction: 'up' | 'down';
}

export class CardCommentBodyDto {
  @ApiProperty({ maxLength: 4000, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(4000)
  body: string;
}

export class CardAttachmentFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @Type(() => Object)
  file?: unknown;
}

export class ChecklistItemBodyDto {
  @ApiProperty({ maxLength: MAX_CHECKLIST_BODY_LENGTH, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_CHECKLIST_BODY_LENGTH)
  body: string;
}

export class UpdateChecklistItemDto {
  @ApiPropertyOptional({ maxLength: MAX_CHECKLIST_BODY_LENGTH, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_CHECKLIST_BODY_LENGTH)
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  done?: boolean;
}

export class CreateProjectFolderDto {
  @ApiProperty({ enum: ['folder'] })
  @IsIn(['folder'])
  kind: 'folder';

  @ApiProperty({ maxLength: MAX_NAME_LENGTH, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_NAME_LENGTH)
  name: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsOptional()
  @IsUUID('4')
  parentId?: string | null;
}

export class UpdateProjectDocumentDto {
  @ApiPropertyOptional({ maxLength: MAX_NAME_LENGTH, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_NAME_LENGTH)
  name?: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsOptional()
  @IsUUID('4')
  parentId?: string | null;
}

export class UploadProjectDocumentsDto {
  @ApiPropertyOptional({ enum: ['folder'] })
  @IsOptional()
  @IsIn(['folder'])
  kind?: 'folder';

  @ApiPropertyOptional({ maxLength: MAX_NAME_LENGTH, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_NAME_LENGTH)
  name?: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  @ValidateIf(
    (_, value) => value !== null && value !== undefined && value !== '',
  )
  @IsOptional()
  @IsUUID('4')
  parentId?: string | null;

  @ApiPropertyOptional({ isArray: true, type: String })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value === 'string') {
      if (value.startsWith('[')) {
        try {
          return JSON.parse(value) as string[];
        } catch {
          return [value];
        }
      }

      return [value];
    }

    return Array.isArray(value)
      ? value.map((item) => String(item))
      : [String(value)];
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relativePaths?: string[];
}

export class BoardBackgroundFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @Type(() => Object)
  file?: unknown;
}
