import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validateEnvironment } from './config/environment.js';
import { createTypeOrmOptions } from './database/typeorm-options.js';
import { RateLimitGuard } from './common/security/rate-limit.guard.js';
import { AiAgentModule } from './modules/ai-agent/ai-agent.module.js';
import { ContactModule } from './modules/contact/contact.module.js';
import { ExpensesModule } from './modules/expenses/expenses.module.js';
import { MailModule } from './modules/mail/mail.module.js';
import { PowerBiModule } from './modules/powerbi/powerbi.module.js';
import { PortalModule } from './modules/portal/portal.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { TicketsModule } from './modules/tickets/tickets.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createTypeOrmOptions(config, config.get('NODE_ENV') !== 'test'),
    }),
    MailModule,
    ContactModule,
    PortalModule,
    ProjectsModule,
    ExpensesModule,
    TicketsModule,
    PowerBiModule,
    AiAgentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
