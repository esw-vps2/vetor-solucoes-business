import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { projectWorkspaceExample } from '../../common/swagger/examples.js';
import { AccessTokenGuard } from '../portal/access-token.guard.js';
import type { AuthenticatedRequest } from '../portal/auth.types.js';
import { ProjectNameDto } from './dto/project-name.dto.js';
import {
  ProjectSummaryDto,
  ProjectWorkspaceDto,
} from './dto/project-response.dto.js';
import { ViewProjectsGuard } from './guards/view-projects.guard.js';
import { WorkspaceManagerGuard } from './guards/workspace-manager.guard.js';
import { ProjectsService } from './projects.service.js';

const uuidPipe = new ParseUUIDPipe({ version: '4' });

@ApiTags('project-workspaces')
@Controller('project-workspaces')
@UseGuards(AccessTokenGuard)
@ApiCookieAuth('access-cookie')
export class ProjectWorkspacesController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @UseGuards(ViewProjectsGuard)
  @ApiOperation({ summary: 'List project workspaces for the session tenant' })
  @ApiOkResponse({
    content: {
      'application/json': { example: [projectWorkspaceExample] },
    },
    isArray: true,
    type: ProjectWorkspaceDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async list(
    @Req() request: AuthenticatedRequest,
  ): Promise<ProjectWorkspaceDto[]> {
    return this.projectsService.listWorkspaces(request.user);
  }

  @Post()
  @UseGuards(WorkspaceManagerGuard)
  @ApiOperation({ summary: 'Create a project workspace in the session tenant' })
  @ApiBody({ type: ProjectNameDto })
  @ApiCreatedResponse({
    content: {
      'application/json': { example: projectWorkspaceExample },
    },
    type: ProjectWorkspaceDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ProjectNameDto,
  ): Promise<ProjectWorkspaceDto> {
    return this.projectsService.createWorkspace(request.user, dto.name);
  }

  @Patch(':id')
  @UseGuards(WorkspaceManagerGuard)
  @ApiOperation({ summary: 'Rename a project workspace' })
  @ApiBody({ type: ProjectNameDto })
  @ApiOkResponse({ type: ProjectWorkspaceDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: ProjectNameDto,
  ): Promise<ProjectWorkspaceDto> {
    return this.projectsService.updateWorkspace(request.user, id, dto.name);
  }

  @Delete(':id')
  @UseGuards(WorkspaceManagerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project workspace and its dependents' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.projectsService.deleteWorkspace(request.user, id);
  }

  @Get(':workspaceId/projects')
  @UseGuards(ViewProjectsGuard)
  @ApiOperation({ summary: 'List projects in a workspace' })
  @ApiOkResponse({ isArray: true, type: ProjectSummaryDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async listProjects(
    @Param('workspaceId', uuidPipe) workspaceId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ProjectSummaryDto[]> {
    return this.projectsService.listProjects(request.user, workspaceId);
  }

  @Post(':workspaceId/projects')
  @UseGuards(WorkspaceManagerGuard)
  @ApiOperation({ summary: 'Create a project in a workspace' })
  @ApiBody({ type: ProjectNameDto })
  @ApiCreatedResponse({ type: ProjectSummaryDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async createProject(
    @Param('workspaceId', uuidPipe) workspaceId: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: ProjectNameDto,
  ): Promise<ProjectSummaryDto> {
    return this.projectsService.createProject(
      request.user,
      workspaceId,
      dto.name,
    );
  }
}
