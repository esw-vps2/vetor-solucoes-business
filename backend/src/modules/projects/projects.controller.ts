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
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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
import {
  createCardExample,
  projectBoardExample,
  projectSummaryExample,
} from '../../common/swagger/examples.js';
import { AccessTokenGuard } from '../portal/access-token.guard.js';
import type { AuthenticatedRequest } from '../portal/auth.types.js';
import { MulterExceptionFilter } from '../portal/multer-exception.filter.js';
import {
  backgroundUploadOptions,
  documentUploadOptions,
} from './attachment-upload.js';
import {
  BoardBackgroundFileDto,
  CreateCardDto,
  UpdateProjectDocumentDto,
  UploadProjectDocumentsDto,
} from './dto/card.dto.js';
import { UpdateProjectDto } from './dto/kanban-filters.dto.js';
import {
  CardDto,
  ProjectBackgroundDto,
  ProjectBoardDto,
  ProjectDocumentDto,
  ProjectSummaryDto,
} from './dto/project-response.dto.js';
import { AdministradorTenantGuard } from './guards/administrador-tenant.guard.js';
import { ViewProjectsGuard } from './guards/view-projects.guard.js';
import { ProjectUpdateGuard } from './guards/project-update.guard.js';
import { WorkspaceManagerGuard } from './guards/workspace-manager.guard.js';
import { ProjectsService } from './projects.service.js';

const uuidPipe = new ParseUUIDPipe({ version: '4' });

@ApiTags('projects')
@Controller('projects')
@UseGuards(AccessTokenGuard)
@ApiCookieAuth('access-cookie')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get(':id')
  @UseGuards(ViewProjectsGuard)
  @ApiOperation({ summary: 'Load a project Kanban board' })
  @ApiOkResponse({
    content: { 'application/json': { example: projectBoardExample } },
    type: ProjectBoardDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ProjectBoardDto> {
    return this.projectsService.getBoard(request.user, id);
  }

  @Patch(':id')
  @UseGuards(ProjectUpdateGuard)
  @ApiOperation({ summary: 'Rename a project or store its Kanban filters' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiOkResponse({
    content: { 'application/json': { example: projectSummaryExample } },
    type: ProjectSummaryDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectSummaryDto> {
    if (
      dto.name === undefined &&
      dto.kanbanFilters === undefined &&
      dto.kanbanLanes === undefined
    ) {
      throw new BadRequestException('Invalid input.');
    }

    return this.projectsService.updateProject(request.user, id, dto);
  }

  @Delete(':id')
  @UseGuards(WorkspaceManagerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project and its cards' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.projectsService.deleteProject(request.user, id);
  }

  @Post(':id/cards')
  @UseGuards(ViewProjectsGuard)
  @ApiOperation({ summary: 'Create a card on a project board' })
  @ApiBody({
    examples: { mock: { value: createCardExample } },
    type: CreateCardDto,
  })
  @ApiCreatedResponse({ type: CardDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async createCard(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCardDto,
  ): Promise<CardDto> {
    return this.projectsService.createCard(request.user, id, dto);
  }

  @Put(':id/background')
  @UseGuards(AdministradorTenantGuard)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('file', backgroundUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Set the board background image' })
  @ApiBody({ type: BoardBackgroundFileDto })
  @ApiOkResponse({ type: ProjectBackgroundDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async putBackground(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ProjectBackgroundDto> {
    return this.projectsService.putBackground(request.user, id, file);
  }

  @Delete(':id/background')
  @UseGuards(AdministradorTenantGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove the board background image' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async deleteBackground(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.projectsService.deleteBackground(request.user, id);
  }

  @Get(':id/background')
  @UseGuards(ViewProjectsGuard)
  @Header('Cache-Control', 'private, no-store')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  @ApiOperation({ summary: 'Download the board background image' })
  @ApiResponse({ status: 200, description: 'Image bytes' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async readBackground(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.projectsService.readBackground(request.user, id);
    response.setHeader('Content-Type', file.contentType);
    return new StreamableFile(file.bytes);
  }

  @Post(':id/documents')
  @UseGuards(ViewProjectsGuard)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FilesInterceptor('files', 200, documentUploadOptions))
  @ApiOperation({ summary: 'Create a project folder or upload files' })
  @ApiBody({ type: UploadProjectDocumentsDto })
  @ApiCreatedResponse({ type: ProjectDocumentDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async createDocuments(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UploadProjectDocumentsDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<ProjectDocumentDto | ProjectDocumentDto[]> {
    if (files && files.length > 0) {
      return this.projectsService.uploadDocuments(
        request.user,
        id,
        files,
        dto.parentId ?? null,
        dto.relativePaths,
      );
    }

    if (dto.kind === 'folder' && dto.name) {
      return this.projectsService.createFolder(request.user, id, {
        kind: 'folder',
        name: dto.name,
        parentId: dto.parentId,
      });
    }

    throw new BadRequestException('Invalid input.');
  }

  @Get(':id/documents/:documentId/archive')
  @UseGuards(ViewProjectsGuard)
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Download a project folder as a zip archive' })
  @ApiResponse({ status: 200, description: 'Zip bytes' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async archiveDocument(
    @Param('id', uuidPipe) id: string,
    @Param('documentId', uuidPipe) documentId: string,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.projectsService.archiveDocument(
      request.user,
      id,
      documentId,
    );
    response.setHeader('Content-Type', 'application/zip');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename.replace(/["\\]/g, '_')}"`,
    );
    return new StreamableFile(file.stream);
  }

  @Get(':id/documents/:documentId')
  @UseGuards(ViewProjectsGuard)
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Download a project file' })
  @ApiResponse({ status: 200, description: 'File bytes' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async readDocument(
    @Param('id', uuidPipe) id: string,
    @Param('documentId', uuidPipe) documentId: string,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.projectsService.readDocument(
      request.user,
      id,
      documentId,
    );
    response.setHeader('Content-Type', file.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName.replace(/["\\]/g, '_')}"`,
    );
    return new StreamableFile(file.bytes);
  }

  @Patch(':id/documents/:documentId')
  @UseGuards(ViewProjectsGuard)
  @ApiOperation({ summary: 'Rename or move a project document' })
  @ApiBody({ type: UpdateProjectDocumentDto })
  @ApiOkResponse({ type: ProjectDocumentDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateDocument(
    @Param('id', uuidPipe) id: string,
    @Param('documentId', uuidPipe) documentId: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateProjectDocumentDto,
  ): Promise<ProjectDocumentDto> {
    return this.projectsService.updateDocument(
      request.user,
      id,
      documentId,
      dto,
    );
  }

  @Delete(':id/documents/:documentId')
  @UseGuards(ViewProjectsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project file or folder' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async deleteDocument(
    @Param('id', uuidPipe) id: string,
    @Param('documentId', uuidPipe) documentId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.projectsService.deleteDocument(request.user, id, documentId);
  }
}
