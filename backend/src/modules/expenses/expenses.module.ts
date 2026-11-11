import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessTokenGuard } from '../portal/access-token.guard.js';
import { Tenant } from '../portal/entities/tenant.entity.js';
import { User } from '../portal/entities/user.entity.js';
import { AdministradorGuard } from '../portal/guards/administrador.guard.js';
import { PortalModule } from '../portal/portal.module.js';
import { ProjectWorkspace } from '../projects/entities/project-workspace.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { ExpenseCategory } from './entities/expense-category.entity.js';
import { ExpenseSeries } from './entities/expense-series.entity.js';
import { ExpenseSubcategory } from './entities/expense-subcategory.entity.js';
import { OperatingExpenseDocument } from './entities/operating-expense-document.entity.js';
import { OperatingExpense } from './entities/operating-expense.entity.js';
import {
  ExpenseCategoriesController,
  ExpenseSeriesController,
  ExpenseSubcategoriesController,
  ExpensesController,
} from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';

@Module({
  controllers: [
    ExpensesController,
    ExpenseCategoriesController,
    ExpenseSubcategoriesController,
    ExpenseSeriesController,
  ],
  imports: [
    PortalModule,
    TypeOrmModule.forFeature([
      ExpenseCategory,
      ExpenseSeries,
      ExpenseSubcategory,
      OperatingExpense,
      OperatingExpenseDocument,
      Project,
      ProjectWorkspace,
      Tenant,
      User,
    ]),
  ],
  providers: [AccessTokenGuard, AdministradorGuard, ExpensesService],
})
export class ExpensesModule {}
