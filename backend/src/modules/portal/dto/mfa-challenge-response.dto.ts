import { ApiProperty } from '@nestjs/swagger';

export class MfaChallengeResponseDto {
  @ApiProperty({ example: true })
  mfaRequired: true;

  @ApiProperty({ format: 'uuid' })
  challengeId: string;

  @ApiProperty({ example: '2026-10-01T13:00:00.000Z' })
  expiresAt: string;
}
