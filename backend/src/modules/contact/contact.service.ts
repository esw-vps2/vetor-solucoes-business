import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service.js';
import { CreateContactDto } from './dto/create-contact.dto.js';

@Injectable()
export class ContactService {
  constructor(private readonly mail: MailService) {}

  async send(dto: CreateContactDto): Promise<void> {
    await this.mail.sendContact(
      dto.customerName.trim(),
      dto.customerEmail.trim().toLowerCase(),
      dto.projectDescription.trim(),
    );
  }
}
