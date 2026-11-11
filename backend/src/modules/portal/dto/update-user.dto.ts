import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { createUserExample } from '../../../common/swagger/examples.js';
import { MAPPED_ACTIONS, parseEnabledActions } from '../enabled-actions.js';

function isRegistrationPatch(dto: UpdateUserDto): boolean {
  return (
    dto.firstName !== undefined ||
    dto.lastName !== undefined ||
    dto.cargo !== undefined ||
    dto.age !== undefined ||
    dto.sex !== undefined ||
    dto.email !== undefined
  );
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: createUserExample.firstName, maxLength: 160 })
  @ValidateIf(isRegistrationPatch)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  firstName?: string;

  @ApiPropertyOptional({ example: createUserExample.lastName, maxLength: 160 })
  @ValidateIf(isRegistrationPatch)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Product Manager', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  cargo?: string;

  @ApiPropertyOptional({ example: createUserExample.age })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return Number(value);
  })
  @ValidateIf(isRegistrationPatch)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(150)
  age?: number;

  @ApiPropertyOptional({
    example: createUserExample.sex,
    enum: ['M', 'F', 'O'],
  })
  @ValidateIf(isRegistrationPatch)
  @IsIn(['M', 'F', 'O'])
  sex?: 'M' | 'F' | 'O';

  @ApiPropertyOptional({ example: createUserExample.email, maxLength: 255 })
  @ValidateIf(isRegistrationPatch)
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    enum: MAPPED_ACTIONS,
    example: createUserExample.enabledActions,
    isArray: true,
  })
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : parseEnabledActions(value),
  )
  @IsOptional()
  @IsArray()
  @IsIn(MAPPED_ACTIONS, { each: true })
  enabledActions?: string[];

  @ApiPropertyOptional({
    enum: ['Usuario', 'AdministradorTenant', 'Administrador'],
  })
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null ? undefined : value,
  )
  @IsOptional()
  @IsIn(['Usuario', 'AdministradorTenant', 'Administrador'])
  profile?: 'Usuario' | 'AdministradorTenant' | 'Administrador';

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Home tenant. Only profile Administrador may send this field.',
  })
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null ? undefined : value,
  )
  @IsOptional()
  @IsUUID('4')
  tenantId?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @Allow()
  photo?: unknown;
}
