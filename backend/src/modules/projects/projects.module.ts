import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessTokenGuard } from '../portal/access-token.guard.js';
import { Tenant } from '../portal/entities/tenant.entity.js';
import { User } from '../portal/entities/user.entity.js';
import { AdministradorGuard } from '../portal/guards/administrador.guard.js';
import { PortalModule } from '../portal/portal.module.js';
import { CardsController } from './cards.controller.js';
import { FinanceController } from './finance.controller.js';
import { CardAttachment } from './entities/card-attachment.entity.js';
import { CardChecklistItem } from './entities/card-checklist-item.entity.js';
import { CardComment } from './entities/card-comment.entity.js';
import { Card } from './entities/card.entity.js';
import { ProjectContractInstallment } from './entities/project-contract-installment.entity.js';
import { ProjectContract } from './entities/project-contract.entity.js';
import { ProjectCost } from './entities/project-cost.entity.js';
import { ProjectDocument } from './entities/project-document.entity.js';
import { ProjectPayment } from './entities/project-payment.entity.js';
import { ProjectWorkspace } from './entities/project-workspace.entity.js';
import { Project } from './entities/project.entity.js';
import { FinanceProjectDocument } from './entities/finance-project-document.entity.js';
import { TenantNote } from './entities/tenant-note.entity.js';
import { AdministradorTenantGuard } from './guards/administrador-tenant.guard.js';
import { MoveCardsGuard } from './guards/move-cards.guard.js';
import { ProjectUpdateGuard } from './guards/project-update.guard.js';
import { ViewProjectsGuard } from './guards/view-projects.guard.js';
import { WorkspaceManagerGuard } from './guards/workspace-manager.guard.js';
import { ProjectWorkspacesController } from './project-workspaces.controller.js';
import { ProjectFinanceController } from './project-finance.controller.js';
import { ProjectFinanceService } from './project-finance.service.js';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { FinanceDocumentsService } from './finance-documents.service.js';
import { TenantNotesService } from './tenant-notes.service.js';

@Module({
  controllers: [
    ProjectWorkspacesController,
    ProjectsController,
    ProjectFinanceController,
    FinanceController,
    CardsController,
  ],
  imports: [
    PortalModule,
    TypeOrmModule.forFeature([
      Card,
      CardAttachment,
      CardChecklistItem,
      CardComment,
      FinanceProjectDocument,
      Project,
      ProjectContract,
      ProjectContractInstallment,
      ProjectCost,
      ProjectDocument,
      ProjectPayment,
      ProjectWorkspace,
      Tenant,
      TenantNote,
      User,
    ]),
  ],
  providers: [
    AccessTokenGuard,
    AdministradorGuard,
    AdministradorTenantGuard,
    MoveCardsGuard,
    ProjectUpdateGuard,
    ProjectFinanceService,
    FinanceDocumentsService,
    ProjectsService,
    TenantNotesService,
    ViewProjectsGuard,
    WorkspaceManagerGuard,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}
