import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { contactExample } from '../../../common/swagger/examples.js';

export class CreateContactDto {
  @ApiProperty({ example: contactExample.customerName, maxLength: 160 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(160)
  customerName: string;

  @ApiProperty({ example: contactExample.customerEmail, maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  customerEmail: string;

  @ApiProperty({
    example: contactExample.projectDescription,
    maxLength: 5000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  projectDescription: string;
}
