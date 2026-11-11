import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EXPENSE_INTERVALS,
  EXPENSE_STATUSES,
  EXPENSE_TYPES,
} from '../expense.constants.js';

export class ExpenseDocumentDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  byteSize: number;

  @ApiProperty()
  createdAt: string;
}

export class ExpenseItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ format: 'uuid' })
  categoryId: string;

  @ApiProperty()
  categoryName: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  subcategoryId: string | null;

  @ApiPropertyOptional({ nullable: true })
  subcategoryName: string | null;

  @ApiProperty()
  amountCents: number;

  @ApiProperty({ example: '2026-10' })
  competenceMonth: string;

  @ApiProperty({ enum: EXPENSE_TYPES })
  expenseType: string;

  @ApiPropertyOptional({ nullable: true })
  supplierName: string | null;

  @ApiPropertyOptional({ nullable: true })
  dueOn: string | null;

  @ApiPropertyOptional({ nullable: true })
  paidOn: string | null;

  @ApiPropertyOptional({ nullable: true })
  paymentMethod: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  clientTenantId: string | null;

  @ApiPropertyOptional({ nullable: true })
  clientTenantName: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  projectId: string | null;

  @ApiPropertyOptional({ nullable: true })
  projectName: string | null;

  @ApiProperty({ enum: EXPENSE_STATUSES })
  status: string;

  @ApiPropertyOptional({ enum: EXPENSE_INTERVALS, nullable: true })
  recurrence: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  seriesId: string | null;

  @ApiPropertyOptional({ nullable: true })
  seriesIndex: number | null;

  @ApiProperty()
  seriesDetached: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class ExpenseDetailDto extends ExpenseItemDto {
  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiProperty({ type: [ExpenseDocumentDto] })
  documents: ExpenseDocumentDto[];
}

export class ExpenseSummaryDto {
  @ApiProperty()
  periodTotalCents: number;

  @ApiProperty()
  paidTotalCents: number;

  @ApiProperty()
  pendingTotalCents: number;

  @ApiProperty()
  count: number;
}

export class ExpenseListDto {
  @ApiProperty({ type: [ExpenseItemDto] })
  items: ExpenseItemDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ type: ExpenseSummaryDto })
  summary: ExpenseSummaryDto;
}

export class ExpenseSeriesCreatedDto {
  @ApiProperty({ format: 'uuid' })
  seriesId: string;

  @ApiProperty()
  generatedCount: number;

  @ApiProperty({ format: 'uuid' })
  firstExpenseId: string;
}

export class CancelExpensesResultDto {
  @ApiProperty({ format: 'uuid', isArray: true })
  cancelledIds: string[];

  @ApiProperty({ format: 'uuid', isArray: true })
  alreadyCancelledIds: string[];
}

export class CancelSeriesResultDto {
  @ApiProperty()
  cancelledCount: number;
}

export class ExpenseSubcategoryNodeDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  position: number;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  expenseCount: number;
}

export class ExpenseCategoryNodeDto extends ExpenseSubcategoryNodeDto {
  @ApiProperty({ type: [ExpenseSubcategoryNodeDto] })
  subcategories: ExpenseSubcategoryNodeDto[];
}

export class ExpenseAssociationTenantDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;
}

export class ExpenseAssociationProjectDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ format: 'uuid' })
  tenantId: string;

  @ApiProperty()
  tenantName: string;
}

export class ExpenseAssociationsDto {
  @ApiProperty({ type: [ExpenseAssociationTenantDto] })
  tenants: ExpenseAssociationTenantDto[];

  @ApiProperty({ type: [ExpenseAssociationProjectDto] })
  projects: ExpenseAssociationProjectDto[];
}
