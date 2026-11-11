import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module.js';
import { AccessTokenGuard } from '../portal/access-token.guard.js';
import { Tenant } from '../portal/entities/tenant.entity.js';
import { User } from '../portal/entities/user.entity.js';
import { PortalModule } from '../portal/portal.module.js';
import { TicketAttachment } from './entities/ticket-attachment.entity.js';
import { TicketComment } from './entities/ticket-comment.entity.js';
import { TicketReadState } from './entities/ticket-read-state.entity.js';
import { Ticket } from './entities/ticket.entity.js';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';

@Module({
  controllers: [TicketsController],
  imports: [
    PortalModule,
    MailModule,
    TypeOrmModule.forFeature([
      Tenant,
      Ticket,
      TicketAttachment,
      TicketComment,
      TicketReadState,
      User,
    ]),
  ],
  providers: [AccessTokenGuard, TicketsService],
})
export class TicketsModule {}
