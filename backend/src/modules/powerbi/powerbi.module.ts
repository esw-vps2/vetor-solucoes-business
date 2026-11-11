import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessTokenGuard } from '../portal/access-token.guard.js';
import { Tenant } from '../portal/entities/tenant.entity.js';
import { User } from '../portal/entities/user.entity.js';
import { AdministradorGuard } from '../portal/guards/administrador.guard.js';
import { ViewReportsGuard } from './guards/view-reports.guard.js';
import { PortalModule } from '../portal/portal.module.js';
import { PowerBiReportDistribution } from './entities/powerbi-report-distribution.entity.js';
import { PowerBiReport } from './entities/powerbi-report.entity.js';
import { PowerBiProxyService } from './powerbi-proxy.service.js';
import { PowerBiController } from './powerbi.controller.js';
import { PowerBiService } from './powerbi.service.js';

@Module({
  controllers: [PowerBiController],
  imports: [
    PortalModule,
    TypeOrmModule.forFeature([
      PowerBiReport,
      PowerBiReportDistribution,
      Tenant,
      User,
    ]),
  ],
  providers: [
    AccessTokenGuard,
    AdministradorGuard,
    ViewReportsGuard,
    PowerBiProxyService,
    PowerBiService,
  ],
})
export class PowerBiModule {}
