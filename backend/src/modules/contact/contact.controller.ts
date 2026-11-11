import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RateLimit } from '../../common/security/rate-limit.decorator.js';
import { contactExample } from '../../common/swagger/examples.js';
import { ContactService } from './contact.service.js';
import { CreateContactDto } from './dto/create-contact.dto.js';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Send a project inquiry by email' })
  @ApiBody({
    type: CreateContactDto,
    examples: { mock: { value: contactExample } },
  })
  @ApiNoContentResponse()
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 503, description: 'Email delivery failed' })
  @RateLimit({
    key: 'contact',
    maxEnvironmentVariable: 'CONTACT_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'CONTACT_RATE_LIMIT_WINDOW',
  })
  async create(@Body() dto: CreateContactDto): Promise<void> {
    try {
      await this.contactService.send(dto);
    } catch {
      throw new ServiceUnavailableException(
        'Could not send the contact message.',
      );
    }
  }
}
