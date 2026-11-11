import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiAcceptedResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { RateLimit } from '../../common/security/rate-limit.decorator.js';
import { AccessTokenGuard } from '../portal/access-token.guard.js';
import type { AuthenticatedRequest } from '../portal/auth.types.js';
import { AiConversationsService } from './ai-conversations.service.js';
import { AiAttachmentsService } from './ai-attachments.service.js';
import { aiAgentUploadOptions } from './ai-agent-upload.js';
import { AiStreamService } from './ai-stream.service.js';
import {
  AiAttachmentCreatedDto,
  AiPricingDto,
  ConversationCreatedDto,
  ConversationListDto,
  ConversationSummaryDto,
  CreateConversationDto,
  CreateMessageDto,
  ListConversationsQueryDto,
  MessageViewDto,
  RunStatusDto,
  RunSubmissionDto,
  UpdateConversationTitleDto,
} from './dto/ai-agent.dto.js';

const uuidPipe = new ParseUUIDPipe({ version: '4' });
const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{1,128}$/;

@ApiTags('ai')
@Controller('ai')
@UseGuards(AccessTokenGuard)
@ApiCookieAuth('access-cookie')
export class AiAgentController {
  constructor(
    private readonly conversations: AiConversationsService,
    private readonly attachments: AiAttachmentsService,
    private readonly streams: AiStreamService,
  ) {}

  @Get('pricing')
  @ApiOperation({ summary: 'Read AI token pricing for the caller tenant' })
  @ApiOkResponse({ type: AiPricingDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  getPricing(@Req() request: AuthenticatedRequest): Promise<AiPricingDto> {
    return this.conversations.getPricing(request.user);
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({
    key: 'ai-conversation',
    maxEnvironmentVariable: 'AI_CONVERSATION_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'AI_CONVERSATION_RATE_LIMIT_WINDOW',
  })
  @ApiOperation({ summary: 'Create an owner-scoped AI conversation' })
  @ApiCreatedResponse({ type: ConversationCreatedDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  createConversation(
    @Req() request: AuthenticatedRequest,
    @Body() _body: CreateConversationDto,
  ): Promise<ConversationCreatedDto> {
    return this.conversations.createConversation(request.user);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations owned by the caller' })
  @ApiOkResponse({ type: ConversationListDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  listConversations(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListConversationsQueryDto,
  ): Promise<ConversationListDto> {
    return this.conversations.listConversations(
      request.user,
      query.page,
      query.limit,
    );
  }

  @Patch('conversations/:conversationId')
  @ApiOperation({ summary: 'Rename an owned conversation' })
  @ApiOkResponse({ type: ConversationSummaryDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  renameConversation(
    @Req() request: AuthenticatedRequest,
    @Param('conversationId', uuidPipe) conversationId: string,
    @Body() body: UpdateConversationTitleDto,
  ): Promise<ConversationSummaryDto> {
    return this.conversations.renameConversation(
      request.user,
      conversationId,
      body.title,
    );
  }

  @Delete('conversations/:conversationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an owned conversation' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'An active run already exists' })
  async deleteConversation(
    @Req() request: AuthenticatedRequest,
    @Param('conversationId', uuidPipe) conversationId: string,
  ): Promise<void> {
    await this.conversations.deleteConversation(request.user, conversationId);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Read an owned conversation in sequence order' })
  @ApiOkResponse({ type: [MessageViewDto] })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  listMessages(
    @Req() request: AuthenticatedRequest,
    @Param('conversationId', uuidPipe) conversationId: string,
  ): Promise<MessageViewDto[]> {
    return this.conversations.listMessages(request.user, conversationId);
  }

  @Post('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.ACCEPTED)
  @RateLimit({
    key: 'ai-message',
    maxEnvironmentVariable: 'AI_MESSAGE_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'AI_MESSAGE_RATE_LIMIT_WINDOW',
  })
  @ApiOperation({
    description:
      'A succeeded run may list, create, or update cards for one exactly named project the caller can access.',
    summary: 'Store a message and queue an AI run',
  })
  @ApiAcceptedResponse({ type: RunSubmissionDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'An active run already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  submitMessage(
    @Req() request: AuthenticatedRequest,
    @Param('conversationId', uuidPipe) conversationId: string,
    @Body() body: CreateMessageDto,
    @Headers('idempotency-key') idempotencyKey?: string | string[],
  ): Promise<RunSubmissionDto> {
    const attachmentIds = body.attachmentIds ?? [];
    const trimmed = (body.content ?? '').trim();

    if (!trimmed && attachmentIds.length === 0) {
      throw new BadRequestException('Invalid input.');
    }

    const content = trimmed || 'Arquivos anexados.';

    return this.conversations.submitMessage(
      request.user,
      conversationId,
      content,
      attachmentIds,
      readIdempotencyKey(idempotencyKey),
    );
  }

  @Post('conversations/:conversationId/attachments')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', aiAgentUploadOptions))
  @RateLimit({
    key: 'ai-attachment',
    maxEnvironmentVariable: 'AI_MESSAGE_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'AI_MESSAGE_RATE_LIMIT_WINDOW',
  })
  @ApiOperation({ summary: 'Upload a file for an AI conversation message' })
  @ApiCreatedResponse({ type: AiAttachmentCreatedDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  uploadAttachment(
    @Req() request: AuthenticatedRequest,
    @Param('conversationId', uuidPipe) conversationId: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<AiAttachmentCreatedDto> {
    if (!file) {
      throw new BadRequestException('Invalid input.');
    }

    return this.attachments.upload(request.user, conversationId, file);
  }

  @Get('conversations/:conversationId/attachments/:attachmentId')
  @Header('Cache-Control', 'private, no-store')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  @ApiOperation({ summary: 'Read a file bound to an owned conversation message' })
  @ApiResponse({ status: 200, description: 'Attachment bytes' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async readAttachment(
    @Req() request: AuthenticatedRequest,
    @Param('conversationId', uuidPipe) conversationId: string,
    @Param('attachmentId', uuidPipe) attachmentId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.attachments.read(
      request.user,
      conversationId,
      attachmentId,
    );
    const filename = file.originalName.replace(/["\\]/g, '_');
    const disposition = file.mimeType.toLowerCase().startsWith('image/')
      ? 'inline'
      : 'attachment';
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${filename}"`,
    );
    return new StreamableFile(file.bytes);
  }

  @Get('runs/:runId')
  @ApiOperation({ summary: 'Read an owned AI run' })
  @ApiOkResponse({ type: RunStatusDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  getRun(
    @Req() request: AuthenticatedRequest,
    @Param('runId', uuidPipe) runId: string,
  ): Promise<RunStatusDto> {
    return this.conversations.getRun(request.user, runId);
  }

  @Get('runs/:runId/events')
  @ApiOperation({ summary: 'Stream authorized AI run events' })
  @ApiProduces('text/event-stream')
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  events(
    @Req() request: AuthenticatedRequest,
    @Param('runId', uuidPipe) runId: string,
    @Headers('last-event-id') lastEventId: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    return this.streams.stream(
      request.user,
      runId,
      response,
      Array.isArray(lastEventId) ? lastEventId[0] : lastEventId,
    );
  }
}

function readIdempotencyKey(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const key = Array.isArray(value) ? '' : value.trim();

  if (!IDEMPOTENCY_KEY.test(key)) {
    throw new BadRequestException('Invalid input.');
  }

  return key;
}
