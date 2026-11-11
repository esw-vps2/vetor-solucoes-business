import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Allow,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { createTenantExample } from '../../../common/swagger/examples.js';

function trimToUndefined(value: unknown): unknown {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export class CreateTenantDto {
  @ApiProperty({ example: createTenantExample.name, maxLength: 160 })
  @Transform(({ value }) => trimToUndefined(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @ApiProperty({ example: createTenantExample.slug, maxLength: 80 })
  @Transform(({ value }) => trimToUndefined(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  slug: string;

  @ApiPropertyOptional({
    example: createTenantExample.email,
    maxLength: 255,
    nullable: true,
  })
  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ format: 'binary', type: 'string' })
  @Allow()
  photo?: unknown;
}
