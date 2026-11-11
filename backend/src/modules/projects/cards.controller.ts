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
import {
  cardAttachmentExample,
  cardCommentBodyExample,
  cardCommentExample,
  cardExample,
  moveCardExample,
  placeCardExample,
  reorderCardExample,
} from '../../common/swagger/examples.js';
import { AccessTokenGuard } from '../portal/access-token.guard.js';
import type { AuthenticatedRequest } from '../portal/auth.types.js';
import { MulterExceptionFilter } from '../portal/multer-exception.filter.js';
import { attachmentUploadOptions } from './attachment-upload.js';
import {
  CardAttachmentFileDto,
  CardCommentBodyDto,
  ChecklistItemBodyDto,
  MoveCardDto,
  PlaceCardDto,
  ReorderCardDto,
  UpdateCardDto,
  UpdateChecklistItemDto,
} from './dto/card.dto.js';
import {
  CardAttachmentDto,
  CardChecklistItemDto,
  CardCommentDto,
  CardDto,
} from './dto/project-response.dto.js';
import { MoveCardsGuard } from './guards/move-cards.guard.js';
import { ViewProjectsGuard } from './guards/view-projects.guard.js';
import { ProjectsService } from './projects.service.js';

const uuidPipe = new ParseUUIDPipe({ version: '4' });

@ApiTags('cards')
@Controller('cards')
@UseGuards(AccessTokenGuard)
@ApiCookieAuth('access-cookie')
export class CardsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Patch(':id')
  @UseGuards(ViewProjectsGuard)
  @ApiOperation({ summary: 'Update writable card fields' })
  @ApiBody({ type: UpdateCardDto })
  @ApiOkResponse({
    content: { 'application/json': { example: cardExample } },
    type: CardDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateCardDto,
  ): Promise<CardDto> {
    return this.projectsService.updateCard(request.user, id, dto);
  }

  @Delete(':id')
  @UseGuards(ViewProjectsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a card' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.projectsService.deleteCard(request.user, id);
  }

  @Post(':id/move')
  @UseGuards(MoveCardsGuard)
  @ApiOperation({ summary: 'Move a card to another lane' })
  @ApiBody({
    examples: { mock: { value: moveCardExample } },
    type: MoveCardDto,
  })
  @ApiOkResponse({ type: CardDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async move(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: MoveCardDto,
  ): Promise<CardDto> {
    return this.projectsService.moveCard(request.user, id, dto.lane);
  }

  @Post(':id/place')
  @UseGuards(MoveCardsGuard)
  @ApiOperation({ summary: 'Place a card in a lane at an index' })
  @ApiBody({
    examples: { mock: { value: placeCardExample } },
    type: PlaceCardDto,
  })
  @ApiOkResponse({ type: CardDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async place(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: PlaceCardDto,
  ): Promise<CardDto> {
    return this.projectsService.placeCard(
      request.user,
      id,
      dto.lane,
      dto.position,
    );
  }

  @Post(':id/reorder')
  @UseGuards(MoveCardsGuard)
  @ApiOperation({ summary: 'Reorder a card within its lane' })
  @ApiBody({
    examples: { mock: { value: reorderCardExample } },
    type: ReorderCardDto,
  })
  @ApiOkResponse({ type: CardDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async reorder(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: ReorderCardDto,
  ): Promise<CardDto> {
    return this.projectsService.reorderCard(request.user, id, dto.direction);
  }

  @Post(':id/comments')
  @UseGuards(ViewProjectsGuard)
  @ApiOperation({ summary: 'Create a comment on a card' })
  @ApiBody({
    examples: { mock: { value: cardCommentBodyExample } },
    type: CardCommentBodyDto,
  })
  @ApiCreatedResponse({
    content: { 'application/json': { example: cardCommentExample } },
    type: CardCommentDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async createComment(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CardCommentBodyDto,
  ): Promise<CardCommentDto> {
    return this.projectsService.createComment(request.user, id, dto.body);
  }

  @Patch(':id/comments/:commentId')
  @UseGuards(ViewProjectsGuard)
  @ApiOperation({ summary: 'Edit a comment on a card' })
  @ApiBody({ type: CardCommentBodyDto })
  @ApiOkResponse({ type: CardCommentDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateComment(
    @Param('id', uuidPipe) id: string,
    @Param('commentId', uuidPipe) commentId: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CardCommentBodyDto,
  ): Promise<CardCommentDto> {
    return this.projectsService.updateComment(
      request.user,
      id,
      commentId,
      dto.body,
    );
  }

  @Delete(':id/comments/:commentId')
  @UseGuards(ViewProjectsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment on a card' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async deleteComment(
    @Param('id', uuidPipe) id: string,
    @Param('commentId', uuidPipe) commentId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.projectsService.deleteComment(request.user, id, commentId);
  }

  @Post(':id/checklist-items')
  @UseGuards(ViewProjectsGuard)
  @ApiOperation({ summary: 'Create a checklist item' })
  @ApiBody({ type: ChecklistItemBodyDto })
  @ApiCreatedResponse({ type: CardChecklistItemDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async createChecklistItem(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChecklistItemBodyDto,
  ): Promise<CardChecklistItemDto> {
    return this.projectsService.createChecklistItem(request.user, id, dto.body);
  }

  @Patch(':id/checklist-items/:itemId')
  @UseGuards(ViewProjectsGuard)
  @ApiOperation({ summary: 'Update a checklist item' })
  @ApiBody({ type: UpdateChecklistItemDto })
  @ApiOkResponse({ type: CardChecklistItemDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateChecklistItem(
    @Param('id', uuidPipe) id: string,
    @Param('itemId', uuidPipe) itemId: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateChecklistItemDto,
  ): Promise<CardChecklistItemDto> {
    return this.projectsService.updateChecklistItem(
      request.user,
      id,
      itemId,
      dto,
    );
  }

  @Delete(':id/checklist-items/:itemId')
  @UseGuards(ViewProjectsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a checklist item' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async deleteChecklistItem(
    @Param('id', uuidPipe) id: string,
    @Param('itemId', uuidPipe) itemId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.projectsService.deleteChecklistItem(request.user, id, itemId);
  }

  @Post(':id/attachments')
  @UseGuards(ViewProjectsGuard)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('file', attachmentUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Attach an allowed file to a card' })
  @ApiBody({ type: CardAttachmentFileDto })
  @ApiCreatedResponse({
    content: { 'application/json': { example: cardAttachmentExample } },
    type: CardAttachmentDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async addAttachment(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CardAttachmentDto> {
    return this.projectsService.addAttachment(request.user, id, file);
  }

  @Get(':id/attachments/:attachmentId')
  @UseGuards(ViewProjectsGuard)
  @Header('Cache-Control', 'private, no-store')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  @ApiOperation({ summary: 'Download a card attachment' })
  @ApiResponse({ status: 200, description: 'Attachment bytes' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async readAttachment(
    @Param('id', uuidPipe) id: string,
    @Param('attachmentId', uuidPipe) attachmentId: string,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.projectsService.readAttachment(
      request.user,
      id,
      attachmentId,
    );
    response.setHeader('Content-Type', file.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName.replace(/["\\]/g, '_')}"`,
    );
    return new StreamableFile(file.bytes);
  }

  @Delete(':id/attachments/:attachmentId')
  @UseGuards(ViewProjectsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a card attachment' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async deleteAttachment(
    @Param('id', uuidPipe) id: string,
    @Param('attachmentId', uuidPipe) attachmentId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.projectsService.deleteAttachment(request.user, id, attachmentId);
  }
}
