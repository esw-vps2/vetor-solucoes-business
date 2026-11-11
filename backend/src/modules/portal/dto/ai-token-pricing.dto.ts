import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class AiTokenPricingDto {
  @ApiProperty({ example: 0.6 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(999999)
  aiTokenCostPerMillion: number;
}
