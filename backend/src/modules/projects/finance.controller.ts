import {
  Body,
  BadRequestException,
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
  ApiCookieAuth,
  ApiConsumes,
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
import { financeDocumentUploadOptions } from './attachment-upload.js';
import { FinanceProjectDocumentDto } from './dto/finance-document.dto.js';
import { FinanceListDto } from './dto/finance-response.dto.js';
import { TenantNoteDto, UpsertTenantNoteDto } from './dto/tenant-note.dto.js';
import { ProjectFinanceService } from './project-finance.service.js';
import { FinanceDocumentsService } from './finance-documents.service.js';
import { ProjectsService } from './projects.service.js';
import { TenantNotesService } from './tenant-notes.service.js';

@ApiTags('finance')
@Controller('finance')
@UseGuards(AccessTokenGuard, AdministradorGuard)
@ApiCookieAuth('access-cookie')
export class FinanceController {
  constructor(
    private readonly finance: ProjectFinanceService,
    private readonly financeDocuments: FinanceDocumentsService,
    private readonly projects: ProjectsService,
    private readonly notes: TenantNotesService,
  ) {}

  @Get('projects')
  @ApiOperation({ summary: 'List project finance for every tenant' })
  @ApiOkResponse({ type: FinanceListDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  list(@Req() request: AuthenticatedRequest): Promise<FinanceListDto> {
    return this.finance.list(request.user);
  }

  @Get('projects/:projectId/documents')
  @ApiOperation({ summary: 'List private finance documents for a project' })
  @ApiOkResponse({ type: FinanceProjectDocumentDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  listDocuments(
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<FinanceProjectDocumentDto[]> {
    return this.financeDocuments.list(request.user, projectId);
  }

  @Post('projects/:projectId/documents')
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('file', financeDocumentUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      properties: { file: { format: 'binary', type: 'string' } },
      required: ['file'],
      type: 'object',
    },
  })
  @ApiOperation({ summary: 'Upload a private finance document for a project' })
  @ApiCreatedResponse({ type: FinanceProjectDocumentDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  uploadDocument(
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<FinanceProjectDocumentDto> {
    if (!file) {
      throw new BadRequestException('Invalid input.');
    }

    return this.financeDocuments.upload(request.user, projectId, file);
  }

  @Get('projects/:projectId/documents/:documentId')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Download a private finance document' })
  @ApiResponse({ status: 200, description: 'Document bytes' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async readDocument(
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const document = await this.financeDocuments.read(
      request.user,
      projectId,
      documentId,
    );
    response.setHeader('Content-Type', document.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${document.originalName.replace(/["\\]/g, '_')}"`,
    );
    return new StreamableFile(document.bytes);
  }

  @Delete('projects/:projectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project from any tenant' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    return this.projects.deleteProjectAnywhere(request.user, projectId);
  }

  @Get('tenants/:tenantId/notes')
  @ApiOperation({ summary: 'List encrypted notes for one tenant' })
  @ApiOkResponse({ type: TenantNoteDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 503, description: 'Invalid input' })
  listNotes(
    @Param('tenantId', new ParseUUIDPipe({ version: '4' })) tenantId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<TenantNoteDto[]> {
    return this.notes.list(request.user, tenantId);
  }

  @Post('tenants/:tenantId/notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an encrypted note for one tenant' })
  @ApiCreatedResponse({ type: TenantNoteDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 503, description: 'Invalid input' })
  createNote(
    @Param('tenantId', new ParseUUIDPipe({ version: '4' })) tenantId: string,
    @Body() body: UpsertTenantNoteDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<TenantNoteDto> {
    return this.notes.create(request.user, tenantId, body);
  }

  @Patch('tenants/:tenantId/notes/:noteId')
  @ApiOperation({ summary: 'Update an encrypted note for one tenant' })
  @ApiOkResponse({ type: TenantNoteDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 503, description: 'Invalid input' })
  updateNote(
    @Param('tenantId', new ParseUUIDPipe({ version: '4' })) tenantId: string,
    @Param('noteId', new ParseUUIDPipe({ version: '4' })) noteId: string,
    @Body() body: UpsertTenantNoteDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<TenantNoteDto> {
    return this.notes.update(request.user, tenantId, noteId, body);
  }

  @Delete('tenants/:tenantId/notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an encrypted note for one tenant' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 503, description: 'Invalid input' })
  removeNote(
    @Param('tenantId', new ParseUUIDPipe({ version: '4' })) tenantId: string,
    @Param('noteId', new ParseUUIDPipe({ version: '4' })) noteId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    return this.notes.remove(request.user, tenantId, noteId);
  }
}
