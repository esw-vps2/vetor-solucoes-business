import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessTokenGuard } from '../portal/access-token.guard.js';
import { Tenant } from '../portal/entities/tenant.entity.js';
import { User } from '../portal/entities/user.entity.js';
import { PortalModule } from '../portal/portal.module.js';
import { AI_STORE } from './ai-agent.constants.js';
import { AiAgentController } from './ai-agent.controller.js';
import { AiConversationsService } from './ai-conversations.service.js';
import { AiEventBus } from './ai-event-bus.js';
import { AiMetrics } from './ai-metrics.js';
import { AiStreamService } from './ai-stream.service.js';
import { AmqpBroker } from './amqp-broker.js';
import { AiAttachmentsService } from './ai-attachments.service.js';
import { AiConversation } from './entities/ai-conversation.entity.js';
import { AiAttachment } from './entities/ai-attachment.entity.js';
import { AiMessage } from './entities/ai-message.entity.js';
import { AiRun } from './entities/ai-run.entity.js';
import { OutboxEvent } from './entities/outbox-event.entity.js';
import { OpenRouterAdapter } from './openrouter.adapter.js';
import { OutboxPublisher } from './outbox-publisher.js';
import { TypeormAiStore } from './typeorm-ai-store.js';

@Module({
  controllers: [AiAgentController],
  imports: [
    PortalModule,
    TypeOrmModule.forFeature([
      AiAttachment,
      AiConversation,
      AiMessage,
      AiRun,
      OutboxEvent,
      Tenant,
      User,
    ]),
  ],
  providers: [
    AccessTokenGuard,
    AiAttachmentsService,
    AiConversationsService,
    AiEventBus,
    AiMetrics,
    AiStreamService,
    AmqpBroker,
    OpenRouterAdapter,
    OutboxPublisher,
    {
      inject: [DataSource],
      provide: AI_STORE,
      useFactory: (dataSource: DataSource) => new TypeormAiStore(dataSource),
    },
  ],
})
export class AiAgentModule {}
