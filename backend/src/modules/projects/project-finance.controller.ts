import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AccessTokenGuard } from '../portal/access-token.guard.js';
import type { AuthenticatedRequest } from '../portal/auth.types.js';
import { AdministradorGuard } from '../portal/guards/administrador.guard.js';
import { MulterExceptionFilter } from '../portal/multer-exception.filter.js';
import { contractFileUploadOptions } from './attachment-upload.js';
import {
  CostEntryDto,
  PaymentEntryDto,
  ReplaceCostLinesDto,
  UpsertContractDto,
} from './dto/finance.dto.js';
import {
  ContractFileDto,
  CostDto,
  PaymentDto,
  ProjectFinanceDto,
  SavedContractDto,
} from './dto/finance-response.dto.js';
import { ProjectFinanceService } from './project-finance.service.js';

const uuidPipe = new ParseUUIDPipe({ version: '4' });

@ApiTags('finance')
@Controller('projects')
@UseGuards(AccessTokenGuard, AdministradorGuard)
@ApiCookieAuth('access-cookie')
export class ProjectFinanceController {
  constructor(private readonly finance: ProjectFinanceService) {}

  @Get(':id/finance')
  @ApiOperation({ summary: 'Load one project finance record' })
  @ApiOkResponse({ type: ProjectFinanceDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  getProject(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
  ): Promise<ProjectFinanceDto> {
    return this.finance.getProject(request.user, id);
  }

  @Put(':id/contract')
  @ApiOperation({ summary: 'Create or update the project contract' })
  @ApiOkResponse({ type: SavedContractDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  upsertContract(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpsertContractDto,
  ): Promise<SavedContractDto> {
    return this.finance.upsertContract(request.user, id, dto);
  }

  @Post(':id/contract/file')
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('file', contractFileUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      properties: { file: { format: 'binary', type: 'string' } },
      required: ['file'],
      type: 'object',
    },
  })
  @ApiOperation({ summary: 'Upload or replace the contract PDF' })
  @ApiOkResponse({ type: ContractFileDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  saveContractFile(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ContractFileDto> {
    if (!file) {
      throw new BadRequestException('Invalid input.');
    }

    return this.finance.saveContractFile(request.user, id, file);
  }

  @Get(':id/contract/file')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Download the contract PDF' })
  @ApiResponse({ status: 200, description: 'PDF bytes' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async readContractFile(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.finance.readContractFile(request.user, id);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName.replace(/["\\]/g, '_')}"`,
    );
    return new StreamableFile(file.bytes);
  }

  @Delete(':id/contract/file')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove the contract PDF' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  deleteContractFile(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
  ): Promise<void> {
    return this.finance.deleteContractFile(request.user, id);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Record a received payment' })
  @ApiCreatedResponse({ type: PaymentDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  createPayment(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Body() dto: PaymentEntryDto,
  ): Promise<PaymentDto> {
    return this.finance.createPayment(request.user, id, dto);
  }

  @Patch(':id/payments/:paymentId')
  @ApiOperation({ summary: 'Update a received payment' })
  @ApiOkResponse({ type: PaymentDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  updatePayment(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Param('paymentId', uuidPipe) paymentId: string,
    @Body() dto: PaymentEntryDto,
  ): Promise<PaymentDto> {
    return this.finance.updatePayment(request.user, id, paymentId, dto);
  }

  @Delete(':id/payments/:paymentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a received payment' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  deletePayment(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Param('paymentId', uuidPipe) paymentId: string,
  ): Promise<void> {
    return this.finance.deletePayment(request.user, id, paymentId);
  }

  @Post(':id/costs')
  @ApiOperation({ summary: 'Record a project cost' })
  @ApiCreatedResponse({ type: CostDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  createCost(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Body() dto: CostEntryDto,
  ): Promise<CostDto> {
    return this.finance.createCost(request.user, id, dto);
  }

  @Patch(':id/costs/:costId')
  @ApiOperation({ summary: 'Update a project cost' })
  @ApiOkResponse({ type: CostDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  updateCost(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Param('costId', uuidPipe) costId: string,
    @Body() dto: CostEntryDto,
  ): Promise<CostDto> {
    return this.finance.updateCost(request.user, id, costId, dto);
  }

  @Delete(':id/costs/:costId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project cost' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  deleteCost(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Param('costId', uuidPipe) costId: string,
  ): Promise<void> {
    return this.finance.deleteCost(request.user, id, costId);
  }

  @Put(':id/cost-lines')
  @ApiOperation({ summary: 'Replace the project cost lines' })
  @ApiOkResponse({ type: CostDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  replaceCostLines(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Body() dto: ReplaceCostLinesDto,
  ): Promise<CostDto[]> {
    return this.finance.replaceCostLines(request.user, id, dto);
  }
}
