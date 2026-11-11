import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthResponseDto } from './common/health/health-response.dto.js';
import { healthExample } from './common/swagger/examples.js';
import { AppService } from './app.service.js';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Solution health statistics' })
  @ApiOkResponse({
    content: {
      'application/json': {
        example: healthExample,
      },
    },
    type: HealthResponseDto,
  })
  @ApiResponse({
    content: {
      'application/json': {
        example: {
          checks: {
            api: { status: 'up' },
            database: { status: 'down' },
            smtp: { status: 'up' },
          },
          status: 'unhealthy',
        },
      },
    },
    status: 500,
    type: HealthResponseDto,
  })
  async getHealth(): Promise<HealthResponseDto> {
    const health = await this.appService.getHealth();

    if (health.status === 'unhealthy') {
      throw new HttpException(health, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return health;
  }
}
