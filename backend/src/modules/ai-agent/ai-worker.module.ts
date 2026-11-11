import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { validateEnvironment } from '../../config/environment.js';
import { createTypeOrmOptions } from '../../database/typeorm-options.js';
import { Tenant } from '../portal/entities/tenant.entity.js';
import { User } from '../portal/entities/user.entity.js';
import { PortalModule } from '../portal/portal.module.js';
import { AI_STORE } from './ai-agent.constants.js';
import { AiAttachmentsService } from './ai-attachments.service.js';
import { AiMetrics } from './ai-metrics.js';
import { AmqpBroker } from './amqp-broker.js';
import { PgRunNotifier } from './ai-event-bus.js';
import { AiAttachment } from './entities/ai-attachment.entity.js';
import { AiConversation } from './entities/ai-conversation.entity.js';
import { AiMessage } from './entities/ai-message.entity.js';
import { AiRun } from './entities/ai-run.entity.js';
import { OutboxEvent } from './entities/outbox-event.entity.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { ProjectCardToolsService } from './project-card-tools.service.js';
import { OpenRouterAdapter } from './openrouter.adapter.js';
import { RUN_NOTIFIER, RunProcessor } from './run-processor.js';
import { TypeormAiStore } from './typeorm-ai-store.js';
import { WorkerRuntime } from './worker-runtime.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createTypeOrmOptions(config, false),
    }),
    TypeOrmModule.forFeature([
      AiAttachment,
      AiConversation,
      AiMessage,
      AiRun,
      OutboxEvent,
      Tenant,
      User,
    ]),
    PortalModule,
    ProjectsModule,
  ],
  providers: [
    AiAttachmentsService,
    AiMetrics,
    AmqpBroker,
    OpenRouterAdapter,
    PgRunNotifier,
    ProjectCardToolsService,
    RunProcessor,
    WorkerRuntime,
    {
      provide: RUN_NOTIFIER,
      useExisting: PgRunNotifier,
    },
    {
      inject: [DataSource],
      provide: AI_STORE,
      useFactory: (dataSource: DataSource) => new TypeormAiStore(dataSource),
    },
  ],
})
export class AiWorkerModule {}
