import {
  Body,
  Controller,
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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { attachmentUploadOptions } from '../projects/attachment-upload.js';
import { MulterExceptionFilter } from '../portal/multer-exception.filter.js';
import { AccessTokenGuard } from '../portal/access-token.guard.js';
import type { AuthenticatedRequest } from '../portal/auth.types.js';
import {
  TicketAttachmentDto,
  TicketCommentMutationDto,
  TicketDetailDto,
  TicketListDto,
  TicketMutationDto,
} from './dto/ticket-response.dto.js';
import {
  CreateTicketCommentDto,
  CreateTicketDto,
  ListTicketsQueryDto,
  MarkTicketReadDto,
  TicketAttachmentFileDto,
  UpdateTicketStatusDto,
} from './dto/ticket.dto.js';
import { TicketsService } from './tickets.service.js';

const uuidPipe = new ParseUUIDPipe({ version: '4' });

@ApiTags('tickets')
@Controller('tickets')
@UseGuards(AccessTokenGuard)
@ApiCookieAuth('access-cookie')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open a tenant support ticket' })
  @ApiBody({ type: CreateTicketDto })
  @ApiCreatedResponse({ type: TicketMutationDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateTicketDto,
  ): Promise<TicketMutationDto> {
    return this.tickets.create(request.user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List support tickets for the effective tenant' })
  @ApiOkResponse({ type: TicketListDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListTicketsQueryDto,
  ): Promise<TicketListDto> {
    return this.tickets.list(request.user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Load one support ticket' })
  @ApiOkResponse({ type: TicketDetailDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  get(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<TicketDetailDto> {
    return this.tickets.get(request.user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Change a support ticket status' })
  @ApiBody({ type: UpdateTicketStatusDto })
  @ApiOkResponse({ type: TicketMutationDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  updateStatus(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateTicketStatusDto,
  ): Promise<TicketMutationDto> {
    return this.tickets.updateStatus(request.user, id, dto);
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a support ticket comment' })
  @ApiBody({ type: CreateTicketCommentDto })
  @ApiCreatedResponse({ type: TicketCommentMutationDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  createComment(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateTicketCommentDto,
  ): Promise<TicketCommentMutationDto> {
    return this.tickets.createComment(request.user, id, dto);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a support ticket as viewed by the caller' })
  @ApiBody({ type: MarkTicketReadDto })
  @ApiNoContentResponse()
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  markRead(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() _dto: MarkTicketReadDto,
  ): Promise<void> {
    return this.tickets.markRead(request.user, id);
  }

  @Post(':id/attachments')
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('file', attachmentUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Attach an allowed file to a support ticket' })
  @ApiBody({ type: TicketAttachmentFileDto })
  @ApiCreatedResponse({ type: TicketAttachmentDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  addAttachment(
    @Param('id', uuidPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<TicketAttachmentDto> {
    return this.tickets.addAttachment(request.user, id, file);
  }

  @Get(':id/attachments/:attachmentId')
  @Header('Cache-Control', 'private, no-store')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  @ApiOperation({ summary: 'Download a support ticket attachment' })
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
    const file = await this.tickets.readAttachment(
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
}
