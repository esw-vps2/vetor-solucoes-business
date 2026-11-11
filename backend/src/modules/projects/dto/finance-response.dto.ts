import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ContractStatus, CostCategory } from '../finance-amounts.js';

export class FinanceAmountsDto {
  @ApiProperty()
  totalAmountCents: number;

  @ApiProperty()
  paidAmountCents: number;

  @ApiProperty()
  openAmountCents: number;

  @ApiProperty()
  costAmountCents: number;

  @ApiProperty()
  resultAmountCents: number;

  @ApiProperty()
  contractedResultAmountCents: number;
}

export class ContractDto {
  @ApiProperty()
  title: string;

  @ApiPropertyOptional({ nullable: true })
  signedOn: string | null;

  @ApiPropertyOptional({ nullable: true })
  startsOn: string | null;

  @ApiPropertyOptional({ nullable: true })
  endsOn: string | null;

  @ApiProperty()
  totalAmountCents: number;

  @ApiProperty()
  installmentCount: number;

  @ApiProperty()
  status: ContractStatus;

  @ApiProperty()
  hasFile: boolean;

  @ApiPropertyOptional({ nullable: true })
  originalName: string | null;
}

export class InstallmentAmountDto {
  @ApiProperty()
  position: number;

  @ApiProperty()
  amountCents: number;

  @ApiPropertyOptional({ example: '2026-11-09', nullable: true })
  dueOn: string | null;
}

export class SavedContractDto extends ContractDto {
  @ApiProperty({ type: [InstallmentAmountDto] })
  installments: InstallmentAmountDto[];
}

export class FinanceProjectDto extends FinanceAmountsDto {
  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  tenantName: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  projectName: string;

  @ApiProperty()
  workspaceId: string;

  @ApiProperty()
  workspaceName: string;

  @ApiPropertyOptional({ nullable: true, type: ContractDto })
  contract: ContractDto | null;

  @ApiPropertyOptional({ nullable: true })
  installmentCount: number | null;
}

export class FinanceListDto {
  @ApiProperty({ type: [FinanceProjectDto] })
  projects: FinanceProjectDto[];

  @ApiProperty({ type: FinanceAmountsDto })
  totals: FinanceAmountsDto;
}

export class PaymentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  paidOn: string;

  @ApiProperty()
  amountCents: number;

  @ApiPropertyOptional({ nullable: true })
  note: string | null;
}

export class CostDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  incurredOn: string;

  @ApiProperty()
  amountCents: number;

  @ApiProperty()
  category: CostCategory;

  @ApiProperty()
  label: string;

  @ApiPropertyOptional({ nullable: true })
  note: string | null;
}

export class ProjectFinanceDto extends FinanceProjectDto {
  @ApiProperty({ type: [PaymentDto] })
  payments: PaymentDto[];

  @ApiProperty({ type: [CostDto] })
  costs: CostDto[];

  @ApiProperty({ type: [InstallmentAmountDto] })
  installments: InstallmentAmountDto[];
}

export class ContractFileDto {
  @ApiProperty()
  hasFile: boolean;

  @ApiProperty()
  originalName: string;
}
