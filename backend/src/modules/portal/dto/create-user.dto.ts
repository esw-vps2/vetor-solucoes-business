import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
} from 'class-validator';
import { createUserExample } from '../../../common/swagger/examples.js';
import { MAPPED_ACTIONS, parseEnabledActions } from '../enabled-actions.js';
import {
  IsNewPassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_POLICY_DESCRIPTION,
} from '../password-policy.js';

export class CreateUserDto {
  @ApiProperty({ example: createUserExample.tenantId, format: 'uuid' })
  @IsUUID('4')
  tenantId: string;

  @ApiProperty({ example: createUserExample.firstName, maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  firstName: string;

  @ApiProperty({ example: createUserExample.lastName, maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  lastName: string;

  @ApiPropertyOptional({ example: 'Product Manager', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  cargo?: string;

  @ApiProperty({ example: createUserExample.age })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(150)
  age: number;

  @ApiProperty({ example: createUserExample.sex, enum: ['M', 'F', 'O'] })
  @IsIn(['M', 'F', 'O'])
  sex: 'M' | 'F' | 'O';

  @ApiProperty({ example: createUserExample.email, maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: PASSWORD_POLICY_DESCRIPTION,
    example: createUserExample.password,
    maxLength: PASSWORD_MAX_LENGTH,
    minLength: PASSWORD_MIN_LENGTH,
    pattern: PASSWORD_PATTERN.source,
  })
  @IsNewPassword()
  password: string;

  @ApiPropertyOptional({
    enum: MAPPED_ACTIONS,
    example: createUserExample.enabledActions,
    isArray: true,
  })
  @Transform(({ value }) => parseEnabledActions(value))
  @IsOptional()
  @IsArray()
  @IsIn(MAPPED_ACTIONS, { each: true })
  enabledActions?: string[];

  @ApiPropertyOptional({
    description:
      'Administrador is the global profile. AdministradorTenant administers only the new user home tenant. Only Administrador may set this field.',
    enum: ['Administrador', 'AdministradorTenant'],
    example: 'AdministradorTenant',
  })
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null ? undefined : value,
  )
  @IsOptional()
  @IsIn(['Administrador', 'AdministradorTenant'])
  profile?: 'Administrador' | 'AdministradorTenant';

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @Allow()
  photo?: unknown;
}
