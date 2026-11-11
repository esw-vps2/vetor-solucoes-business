import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  CONTRACT_STATUSES,
  COST_CATEGORIES,
  isCalendarDate,
  MAX_FINANCE_ENTRIES,
  MAX_INSTALLMENTS,
  MAX_MONEY_CENTS,
} from '../finance-amounts.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function emptyToUndefined(value: unknown): unknown {
  if (value === '' || value === null) {
    return undefined;
  }

  return value;
}

function blankNoteToNull(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function trimToUndefined(value: unknown): unknown {
  if (value == null) {
    return undefined;
  }

  return typeof value === 'string' ? value.trim() : value;
}

@ValidatorConstraint({ name: 'contractDateOrder', async: false })
class ContractDateOrderConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as { startsOn?: string; endsOn?: string };

    if (!dto.startsOn || !dto.endsOn) {
      return true;
    }

    return dto.endsOn >= dto.startsOn;
  }
}

@ValidatorConstraint({ name: 'installmentDueOn', async: false })
class InstallmentDueOnConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value == null || value === '') {
      return true;
    }

    return typeof value === 'string' && isCalendarDate(value);
  }

  defaultMessage(): string {
    return 'Invalid input.';
  }
}

@ValidatorConstraint({ name: 'contractInstallmentsLength', async: false })
class ContractInstallmentsLengthConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as { installmentCount?: number };
    return Array.isArray(value) && value.length === dto.installmentCount;
  }
}

export class ContractInstallmentAmountDto {
  @ApiProperty({ maximum: MAX_MONEY_CENTS, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_MONEY_CENTS)
  amountCents: number;

  @ApiPropertyOptional({ example: '2026-11-09', nullable: true })
  @Transform(({ value }) => (value === '' ? null : value))
  @Validate(InstallmentDueOnConstraint)
  dueOn?: string | null;
}

export class UpsertContractDto {
  @ApiProperty({ maxLength: 160, minLength: 1 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title: string;

  @ApiPropertyOptional({ example: '2026-09-21', nullable: true })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @Matches(ISO_DATE)
  signedOn?: string;

  @ApiPropertyOptional({ example: '2026-09-21', nullable: true })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @Matches(ISO_DATE)
  startsOn?: string;

  @ApiPropertyOptional({ example: '2026-12-31', nullable: true })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @Matches(ISO_DATE)
  endsOn?: string;

  @ApiProperty({ maximum: MAX_MONEY_CENTS, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_MONEY_CENTS)
  totalAmountCents: number;

  @ApiProperty({ maximum: MAX_INSTALLMENTS, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_INSTALLMENTS)
  installmentCount: number;

  @ApiProperty({ type: [ContractInstallmentAmountDto] })
  @IsArray()
  @ArrayMaxSize(MAX_INSTALLMENTS)
  @Validate(ContractInstallmentsLengthConstraint)
  @ValidateNested({ each: true })
  @Type(() => ContractInstallmentAmountDto)
  installments: ContractInstallmentAmountDto[];

  @ApiProperty({ enum: CONTRACT_STATUSES })
  @IsIn(CONTRACT_STATUSES)
  @Validate(ContractDateOrderConstraint)
  status: (typeof CONTRACT_STATUSES)[number];
}

export class PaymentEntryDto {
  @ApiProperty({ example: '2026-09-21' })
  @Matches(ISO_DATE)
  paidOn: string;

  @ApiProperty({ maximum: MAX_MONEY_CENTS, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_MONEY_CENTS)
  amountCents: number;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @Transform(({ value }) => blankNoteToNull(value))
  @IsString()
  @MaxLength(500)
  note?: string | null;
}

export class CostEntryDto {
  @ApiProperty({ example: '2026-09-21' })
  @Matches(ISO_DATE)
  incurredOn: string;

  @ApiProperty({ maximum: MAX_MONEY_CENTS, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_MONEY_CENTS)
  amountCents: number;

  @ApiProperty({ enum: COST_CATEGORIES })
  @IsIn(COST_CATEGORIES)
  category: (typeof COST_CATEGORIES)[number];

  @ApiPropertyOptional({ maxLength: 80 })
  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  label?: string;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @Transform(({ value }) => blankNoteToNull(value))
  @IsString()
  @MaxLength(500)
  note?: string | null;
}

export class CostLineDto {
  @ApiProperty({ maxLength: 80, minLength: 1 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  label: string;

  @ApiProperty({ maximum: MAX_MONEY_CENTS, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_MONEY_CENTS)
  amountCents: number;
}

export class ReplaceCostLinesDto {
  @ApiProperty({ type: [CostLineDto] })
  @IsArray()
  @ArrayMaxSize(MAX_FINANCE_ENTRIES)
  @ValidateNested({ each: true })
  @Type(() => CostLineDto)
  lines: CostLineDto[];
}
