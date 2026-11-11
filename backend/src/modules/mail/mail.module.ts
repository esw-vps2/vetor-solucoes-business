import { Module } from '@nestjs/common';
import { EmailTemplateService } from './email-template.service.js';
import { MailService } from './mail.service.js';

@Module({
  providers: [EmailTemplateService, MailService],
  exports: [MailService],
})
export class MailModule {}
