import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  CREATE_EXPENSE_STATUSES,
  DEFAULT_EXPENSE_PAGE_LIMIT,
  EXPENSE_INTERVALS,
  EXPENSE_SCOPES,
  EXPENSE_SORTS,
  EXPENSE_STATUSES,
  EXPENSE_TYPES,
  MAX_CATEGORY_NAME,
  MAX_DESCRIPTION,
  MAX_EXPENSE_AMOUNT_CENTS,
  MAX_EXPENSE_PAGE_LIMIT,
  MAX_NOTES,
  MAX_PAYMENT_METHOD,
  MAX_SERIES_COUNT,
  type ExpenseInterval,
  type ExpenseScope,
  type ExpenseSort,
  type ExpenseStatus,
  type ExpenseType,
} from '../expense.constants.js';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function emptyToNull(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class RecurrenceDto {
  @ApiProperty({ enum: EXPENSE_INTERVALS })
  @IsIn(EXPENSE_INTERVALS)
  interval: ExpenseInterval;

  @ApiProperty({ maximum: MAX_SERIES_COUNT, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_SERIES_COUNT)
  count: number;

  @ApiProperty({ example: '2026-10-27' })
  @Matches(DATE)
  startsOn: string;
}

export class CreateExpenseDto {
  @ApiProperty({ maxLength: MAX_DESCRIPTION, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_DESCRIPTION)
  description: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  categoryId: string;

  @ApiProperty({ maximum: MAX_EXPENSE_AMOUNT_CENTS, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_EXPENSE_AMOUNT_CENTS)
  amountCents: number;

  @ApiProperty({ enum: EXPENSE_TYPES })
  @IsIn(EXPENSE_TYPES)
  expenseType: ExpenseType;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsUUID('4')
  subcategoryId?: string | null;

  @ApiPropertyOptional({ maxLength: MAX_DESCRIPTION, nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_DESCRIPTION)
  supplierName?: string | null;

  @ApiPropertyOptional({ example: '2026-10' })
  @IsOptional()
  @Matches(MONTH)
  competenceMonth?: string;

  @ApiPropertyOptional({ example: '2026-10-27', nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @Matches(DATE)
  dueOn?: string | null;

  @ApiPropertyOptional({ enum: CREATE_EXPENSE_STATUSES })
  @IsOptional()
  @IsIn(CREATE_EXPENSE_STATUSES)
  status?: 'pending' | 'paid';

  @ApiPropertyOptional({ example: '2026-10-27', nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @Matches(DATE)
  paidOn?: string | null;

  @ApiPropertyOptional({ maxLength: MAX_PAYMENT_METHOD, nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PAYMENT_METHOD)
  paymentMethod?: string | null;

  @ApiPropertyOptional({ maxLength: MAX_NOTES, nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_NOTES)
  notes?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsUUID('4')
  clientTenantId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsUUID('4')
  projectId?: string | null;

  @ApiPropertyOptional({ type: RecurrenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrenceDto)
  recurrence?: RecurrenceDto;
}

export class UpdateExpenseDto {
  @ApiPropertyOptional({ maxLength: MAX_DESCRIPTION, minLength: 1 })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_DESCRIPTION)
  description?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({ maximum: MAX_EXPENSE_AMOUNT_CENTS, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_EXPENSE_AMOUNT_CENTS)
  amountCents?: number;

  @ApiPropertyOptional({ enum: EXPENSE_TYPES })
  @IsOptional()
  @IsIn(EXPENSE_TYPES)
  expenseType?: ExpenseType;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsUUID('4')
  subcategoryId?: string | null;

  @ApiPropertyOptional({ maxLength: MAX_DESCRIPTION, nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_DESCRIPTION)
  supplierName?: string | null;

  @ApiPropertyOptional({ example: '2026-10' })
  @IsOptional()
  @Matches(MONTH)
  competenceMonth?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @Matches(DATE)
  dueOn?: string | null;

  @ApiPropertyOptional({ enum: EXPENSE_STATUSES })
  @IsOptional()
  @IsIn(EXPENSE_STATUSES)
  status?: ExpenseStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @Matches(DATE)
  paidOn?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PAYMENT_METHOD)
  paymentMethod?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_NOTES)
  notes?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsUUID('4')
  clientTenantId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsUUID('4')
  projectId?: string | null;

  @ApiPropertyOptional({ enum: EXPENSE_SCOPES })
  @IsOptional()
  @IsIn(EXPENSE_SCOPES)
  scope?: ExpenseScope;

  @ApiPropertyOptional({ maximum: MAX_SERIES_COUNT, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_SERIES_COUNT)
  count?: number;

  @ApiPropertyOptional({ example: '2026-10-27' })
  @IsOptional()
  @Matches(DATE)
  startsOn?: string;
}

export class ListExpensesQueryDto {
  @ApiPropertyOptional({ example: '2026-10' })
  @IsOptional()
  @Matches(MONTH)
  competence?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  subcategoryId?: string;

  @ApiPropertyOptional({ enum: EXPENSE_STATUSES })
  @IsOptional()
  @IsIn(EXPENSE_STATUSES)
  status?: ExpenseStatus;

  @ApiPropertyOptional({ maxLength: MAX_DESCRIPTION })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(MAX_DESCRIPTION)
  supplier?: string;

  @ApiPropertyOptional({ enum: EXPENSE_TYPES })
  @IsOptional()
  @IsIn(EXPENSE_TYPES)
  type?: ExpenseType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  projectId?: string;

  @ApiPropertyOptional({ maxLength: MAX_DESCRIPTION })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(MAX_DESCRIPTION)
  q?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    default: DEFAULT_EXPENSE_PAGE_LIMIT,
    maximum: MAX_EXPENSE_PAGE_LIMIT,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_EXPENSE_PAGE_LIMIT)
  limit?: number;

  @ApiPropertyOptional({ enum: EXPENSE_SORTS })
  @IsOptional()
  @IsIn(EXPENSE_SORTS)
  sort?: ExpenseSort;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  direction?: 'asc' | 'desc';
}

export class CancelExpensesDto {
  @ApiProperty({ format: 'uuid', isArray: true, maxItems: 100, minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  ids: string[];
}

export class CategoryNameDto {
  @ApiProperty({ maxLength: MAX_CATEGORY_NAME, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CATEGORY_NAME)
  name: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ maxLength: MAX_CATEGORY_NAME, minLength: 1 })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CATEGORY_NAME)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ExpenseDocumentFileDto {
  @ApiProperty({ format: 'binary', type: 'string' })
  @Type(() => Object)
  file?: unknown;
}
