import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_NAME_LENGTH } from '../project-constants.js';
import { projectWorkspaceExample } from '../../../common/swagger/examples.js';

export class ProjectNameDto {
  @ApiProperty({
    example: projectWorkspaceExample.name,
    maxLength: MAX_NAME_LENGTH,
    minLength: 1,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_NAME_LENGTH)
  name: string;
}
