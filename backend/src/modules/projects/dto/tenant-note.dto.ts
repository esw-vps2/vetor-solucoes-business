import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export const MAX_NOTE_TITLE = 120;
export const MAX_NOTE_BODY = 4000;
export const MAX_TENANT_NOTES = 50;

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpsertTenantNoteDto {
  @ApiProperty({ maxLength: MAX_NOTE_TITLE, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_NOTE_TITLE)
  title: string;

  @ApiProperty({ maxLength: MAX_NOTE_BODY, minLength: 1 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_NOTE_BODY)
  body: string;
}

export class TenantNoteDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  updatedAt: string;
}
