import {
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
  Query,
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
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { financeDocumentUploadOptions } from '../projects/attachment-upload.js';
import { AccessTokenGuard } from '../portal/access-token.guard.js';
import type { AuthenticatedRequest } from '../portal/auth.types.js';
import { MulterExceptionFilter } from '../portal/multer-exception.filter.js';
import { AdministradorGuard } from '../portal/guards/administrador.guard.js';
import {
  CancelExpensesDto,
  CategoryNameDto,
  CreateExpenseDto,
  ExpenseDocumentFileDto,
  ListExpensesQueryDto,
  UpdateCategoryDto,
  UpdateExpenseDto,
} from './dto/expense.dto.js';
import {
  CancelExpensesResultDto,
  CancelSeriesResultDto,
  ExpenseAssociationsDto,
  ExpenseCategoryNodeDto,
  ExpenseDetailDto,
  ExpenseDocumentDto,
  ExpenseListDto,
  ExpenseSeriesCreatedDto,
  ExpenseSubcategoryNodeDto,
} from './dto/expense-response.dto.js';
import { ExpensesService } from './expenses.service.js';

const uuidPipe = new ParseUUIDPipe({ version: '4' });

@ApiTags('expenses')
@ApiExtraModels(ExpenseDetailDto, ExpenseSeriesCreatedDto)
@Controller('expenses')
@UseGuards(AccessTokenGuard, AdministradorGuard)
@ApiCookieAuth('access-cookie')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get('associations')
  @ApiOperation({ summary: 'List tenants and projects that an expense can reference' })
  @ApiOkResponse({ type: ExpenseAssociationsDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  associations(@Req() request: AuthenticatedRequest) {
    return this.expenses.associations(request.user);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel the selected operating expenses' })
  @ApiBody({ type: CancelExpensesDto })
  @ApiOkResponse({ type: CancelExpensesResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  cancelMany(@Req() request: AuthenticatedRequest, @Body() dto: CancelExpensesDto) {
    return this.expenses.cancelMany(request.user, dto.ids);
  }

  @Get()
  @ApiOperation({ summary: 'List operating expenses and the period summary' })
  @ApiOkResponse({ type: ExpenseListDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  list(@Req() request: AuthenticatedRequest, @Query() query: ListExpensesQueryDto) {
    return this.expenses.list(request.user, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an operating expense or project a recurrence' })
  @ApiBody({ type: CreateExpenseDto })
  @ApiCreatedResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ExpenseDetailDto) },
        { $ref: getSchemaPath(ExpenseSeriesCreatedDto) },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateExpenseDto) {
    return this.expenses.create(request.user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Read one operating expense' })
  @ApiOkResponse({ type: ExpenseDetailDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  get(@Req() request: AuthenticatedRequest, @Param('id', uuidPipe) id: string) {
    return this.expenses.get(request.user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit one operating expense or the series it still follows' })
  @ApiBody({ type: UpdateExpenseDto })
  @ApiOkResponse({ type: ExpenseDetailDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenses.update(request.user, id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel one operating expense' })
  @ApiOkResponse({ type: ExpenseDetailDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  cancelOne(@Req() request: AuthenticatedRequest, @Param('id', uuidPipe) id: string) {
    return this.expenses.cancelOne(request.user, id);
  }

  @Post(':id/documents')
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('file', financeDocumentUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Attach a finance document to an operating expense' })
  @ApiBody({ type: ExpenseDocumentFileDto })
  @ApiCreatedResponse({ type: ExpenseDocumentDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  addDocument(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.expenses.addDocument(request.user, id, file);
  }

  @Get(':id/documents/:documentId')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Download an operating expense document' })
  @ApiResponse({ status: 200, description: 'Document bytes' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async readDocument(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Param('documentId', uuidPipe) documentId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.expenses.readDocument(request.user, id, documentId);
    response.setHeader('Content-Type', file.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName.replace(/["\\]/g, '_')}"`,
    );
    return new StreamableFile(file.bytes);
  }

  @Delete(':id/documents/:documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an operating expense document' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  deleteDocument(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Param('documentId', uuidPipe) documentId: string,
  ) {
    return this.expenses.deleteDocument(request.user, id, documentId);
  }
}

@ApiTags('expenses')
@Controller('expense-categories')
@UseGuards(AccessTokenGuard, AdministradorGuard)
@ApiCookieAuth('access-cookie')
export class ExpenseCategoriesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List operating expense categories' })
  @ApiOkResponse({ type: [ExpenseCategoryNodeDto] })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  list(@Req() request: AuthenticatedRequest) {
    return this.expenses.listCategories(request.user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an operating expense category' })
  @ApiBody({ type: CategoryNameDto })
  @ApiCreatedResponse({ type: ExpenseCategoryNodeDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  create(@Req() request: AuthenticatedRequest, @Body() dto: CategoryNameDto) {
    return this.expenses.createCategory(request.user, dto.name);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename or activate an operating expense category' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiOkResponse({ type: ExpenseCategoryNodeDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.expenses.updateCategory(request.user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an unused operating expense category' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  remove(@Req() request: AuthenticatedRequest, @Param('id', uuidPipe) id: string) {
    return this.expenses.deleteCategory(request.user, id);
  }

  @Post(':id/subcategories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a subcategory under an operating expense category' })
  @ApiBody({ type: CategoryNameDto })
  @ApiCreatedResponse({ type: ExpenseSubcategoryNodeDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  createSubcategory(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Body() dto: CategoryNameDto,
  ) {
    return this.expenses.createSubcategory(request.user, id, dto.name);
  }
}

@ApiTags('expenses')
@Controller('expense-subcategories')
@UseGuards(AccessTokenGuard, AdministradorGuard)
@ApiCookieAuth('access-cookie')
export class ExpenseSubcategoriesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Rename or activate an operating expense subcategory' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiOkResponse({ type: ExpenseSubcategoryNodeDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.expenses.updateSubcategory(request.user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an unused operating expense subcategory' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  remove(@Req() request: AuthenticatedRequest, @Param('id', uuidPipe) id: string) {
    return this.expenses.deleteSubcategory(request.user, id);
  }
}

@ApiTags('expenses')
@Controller('expense-series')
@UseGuards(AccessTokenGuard, AdministradorGuard)
@ApiCookieAuth('access-cookie')
export class ExpenseSeriesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel every operating expense in a series' })
  @ApiOkResponse({ type: CancelSeriesResultDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  cancel(@Req() request: AuthenticatedRequest, @Param('id', uuidPipe) id: string) {
    return this.expenses.cancelSeries(request.user, id);
  }
}
