import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class MfaVerifyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  challengeId: string;

  @ApiProperty({
    description:
      'Decimal digits. Surrounding whitespace is removed before the digit check. At most 32 digits remain.',
    example: '0',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\d+$/)
  @MaxLength(32)
  token: string;
}
