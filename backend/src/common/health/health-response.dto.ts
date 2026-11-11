import { ApiProperty } from '@nestjs/swagger';
import type {
  HealthCheckResult,
  HealthResponse,
  SolutionHealthStatus,
} from './health.types.js';

class HealthCheckResultDto implements HealthCheckResult {
  @ApiProperty({ example: 'up', enum: ['up', 'down'] })
  status: HealthCheckResult['status'];
}

export class HealthResponseDto implements HealthResponse {
  @ApiProperty({ example: 'healthy', enum: ['healthy', 'unhealthy'] })
  status: SolutionHealthStatus;

  @ApiProperty({
    example: {
      api: { status: 'up' },
      database: { status: 'up' },
      smtp: { status: 'up' },
    },
  })
  checks: {
    api: HealthCheckResultDto;
    database: HealthCheckResultDto;
    smtp: HealthCheckResultDto;
  };
}
