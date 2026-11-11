import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { kanbanFiltersExample } from '../../../common/swagger/examples.js';
import {
  LANE_KEY_PATTERN,
  MAX_KANBAN_LANES,
  MAX_LANE_LABEL_LENGTH,
} from '../kanban-lanes.js';
import { MAX_NAME_LENGTH } from '../project-constants.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

@ValidatorConstraint({ name: 'kanbanFilterDate', async: false })
class KanbanFilterDateConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const date = args.object as KanbanFilterDateDto;

    if (date.mode === 'start') {
      return typeof date.startDate === 'string' && date.endDate === null;
    }

    if (date.mode === 'end') {
      return date.startDate === null && typeof date.endDate === 'string';
    }

    if (date.mode !== 'range') {
      return false;
    }

    return (
      typeof date.startDate === 'string' &&
      typeof date.endDate === 'string' &&
      date.startDate <= date.endDate
    );
  }
}

export class KanbanFilterDateDto {
  @ApiProperty({ enum: ['start', 'end', 'range'], example: 'range' })
  @IsIn(['start', 'end', 'range'])
  @Validate(KanbanFilterDateConstraint)
  mode: 'start' | 'end' | 'range';

  @ApiProperty({ example: '2026-09-01', nullable: true, type: String })
  @ValidateIf((_, value) => value !== null)
  @Matches(ISO_DATE)
  startDate: string | null;

  @ApiProperty({ example: '2026-09-30', nullable: true, type: String })
  @ValidateIf((_, value) => value !== null)
  @Matches(ISO_DATE)
  endDate: string | null;
}

export class KanbanLaneInputDto {
  @ApiPropertyOptional({ example: 'backlog' })
  @ValidateIf((_, value) => value !== undefined)
  @Matches(LANE_KEY_PATTERN)
  key?: string;

  @ApiProperty({
    example: 'Backlog',
    maxLength: MAX_LANE_LABEL_LENGTH,
    minLength: 1,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_LANE_LABEL_LENGTH)
  label: string;
}

export class KanbanFiltersDto {
  @ApiProperty({
    example: kanbanFiltersExample.status,
    isArray: true,
  })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MAX_KANBAN_LANES)
  @Matches(LANE_KEY_PATTERN, { each: true })
  status: string[];

  @ApiProperty({ nullable: true, type: KanbanFilterDateDto })
  @ValidateIf((_, value) => value !== null)
  @ValidateNested()
  @Type(() => KanbanFilterDateDto)
  date: KanbanFilterDateDto | null;

  @ApiProperty({
    enum: ['all', 'complete', 'incomplete'],
    example: kanbanFiltersExample.taskCompletion,
  })
  @IsIn(['all', 'complete', 'incomplete'])
  taskCompletion: 'all' | 'complete' | 'incomplete';
}

export class UpdateProjectDto {
  @ApiPropertyOptional({
    example: 'Portal Kanban',
    maxLength: MAX_NAME_LENGTH,
    minLength: 1,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((dto: UpdateProjectDto) => dto.name !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_NAME_LENGTH)
  name?: string;

  @ApiPropertyOptional({ type: KanbanFiltersDto })
  @ValidateIf((dto: UpdateProjectDto) => dto.kanbanFilters !== undefined)
  @ValidateNested()
  @Type(() => KanbanFiltersDto)
  kanbanFilters?: KanbanFiltersDto;

  @ApiPropertyOptional({ isArray: true, type: KanbanLaneInputDto })
  @ValidateIf((dto: UpdateProjectDto) => dto.kanbanLanes !== undefined)
  @IsArray()
  @ArrayMaxSize(MAX_KANBAN_LANES)
  @ValidateNested({ each: true })
  @Type(() => KanbanLaneInputDto)
  kanbanLanes?: KanbanLaneInputDto[];
}
