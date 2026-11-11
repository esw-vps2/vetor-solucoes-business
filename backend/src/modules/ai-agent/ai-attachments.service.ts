import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import type { AuthenticatedUser } from '../portal/auth.types.js';
import { hasMappedAction } from '../portal/enabled-actions.js';
import { User } from '../portal/entities/user.entity.js';
import { TenantStorageService } from '../portal/tenant-storage.service.js';
import {
  aiAttachmentPointerFor,
  extensionForAiUpload,
  MAX_AI_ATTACHMENTS_PER_MESSAGE,
  MAX_AI_ATTACHMENT_BYTES,
} from './ai-attachment-file.js';
import { AiAttachment } from './entities/ai-attachment.entity.js';
import { AiConversation } from './entities/ai-conversation.entity.js';
import type { ResolvedAiAttachment } from './ai-provider-content.js';

const ATTACHMENT_TTL_MS = 2 * 24 * 60 * 60 * 1000;
const PURGE_INTERVAL_MS = 60 * 60 * 1000;

export interface AiAttachmentView {
  id: string;
  conversationId: string;
  originalName: string;
  mimeType: string;
  expiresAt: string;
  createdAt: string;
}

export interface AiMessageAttachmentView {
  id: string;
  originalName: string;
  mimeType: string;
}

export interface AiAttachmentFile {
  bytes: Buffer;
  mimeType: string;
  originalName: string;
}

@Injectable()
export class AiAttachmentsService implements OnModuleInit {
  private readonly logger = new Logger(AiAttachmentsService.name);
  private purgeTimer: NodeJS.Timeout | undefined;

  constructor(
    @InjectRepository(AiAttachment)
    private readonly attachments: Repository<AiAttachment>,
    @InjectRepository(AiConversation)
    private readonly conversations: Repository<AiConversation>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly tenantStorage: TenantStorageService,
  ) {}

  onModuleInit(): void {
    void this.purgeExpired();
    this.purgeTimer = setInterval(() => {
      void this.purgeExpired();
    }, PURGE_INTERVAL_MS);
    this.purgeTimer.unref?.();
  }

  async upload(
    session: AuthenticatedUser,
    conversationId: string,
    file: Express.Multer.File,
  ): Promise<AiAttachmentView> {
    await this.assertAgentAccess(session);

    if (!file?.buffer || file.size <= 0 || file.size > MAX_AI_ATTACHMENT_BYTES) {
      throw new BadRequestException('Invalid input.');
    }

    const owned = await this.conversations.findOne({
      where: {
        id: conversationId,
        ownerUserId: session.id,
        tenantId: session.tenantId,
      },
    });

    if (!owned) {
      throw new NotFoundException('Not found.');
    }

    const id = randomUUID();
    const extension = extensionForAiUpload(file.mimetype, file.originalname);
    const pointer = aiAttachmentPointerFor(id, extension);
    await this.tenantStorage.writeTenantFile(
      session.tenantId,
      pointer,
      file.buffer,
      'ai',
    );

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ATTACHMENT_TTL_MS);
    const originalName = sanitizeOriginalName(file.originalname);
    const saved = await this.attachments.save(
      this.attachments.create({
        conversationId,
        createdAt: now,
        expiresAt,
        id,
        messageId: null,
        mimeType: file.mimetype,
        originalName,
        ownerUserId: session.id,
        storagePointer: pointer,
        tenantId: session.tenantId,
        updatedAt: now,
      }),
    );

    return this.toView(saved);
  }

  async listBoundByMessage(
    tenantId: string,
    ownerUserId: string,
    conversationId: string,
    now = new Date(),
  ): Promise<Map<string, AiMessageAttachmentView[]>> {
    const rows = await this.attachments.find({
      order: { createdAt: 'ASC' },
      where: { conversationId, ownerUserId, tenantId },
    });
    const grouped = new Map<string, AiMessageAttachmentView[]>();

    for (const row of rows) {
      if (!row.messageId || row.expiresAt.getTime() <= now.getTime()) {
        continue;
      }

      const current = grouped.get(row.messageId) ?? [];
      current.push({
        id: row.id,
        mimeType: row.mimeType,
        originalName: row.originalName,
      });
      grouped.set(row.messageId, current);
    }

    return grouped;
  }

  async read(
    session: AuthenticatedUser,
    conversationId: string,
    attachmentId: string,
    now = new Date(),
  ): Promise<AiAttachmentFile> {
    await this.assertAgentAccess(session);
    const row = await this.attachments.findOne({
      where: {
        conversationId,
        id: attachmentId,
        ownerUserId: session.id,
        tenantId: session.tenantId,
      },
    });

    if (!row?.messageId || row.expiresAt.getTime() <= now.getTime()) {
      throw new NotFoundException('Not found.');
    }

    try {
      const bytes = await this.tenantStorage.readTenantFile(
        session.tenantId,
        row.storagePointer,
        'ai',
      );
      return {
        bytes,
        mimeType: row.mimeType,
        originalName: row.originalName,
      };
    } catch {
      throw new NotFoundException('Not found.');
    }
  }

  async bindToMessage(
    tenantId: string,
    ownerUserId: string,
    conversationId: string,
    messageId: string,
    attachmentIds: string[],
    now = new Date(),
  ): Promise<void> {
    if (attachmentIds.length === 0) {
      return;
    }

    if (attachmentIds.length > MAX_AI_ATTACHMENTS_PER_MESSAGE) {
      throw new BadRequestException('Invalid input.');
    }

    const uniqueIds = [...new Set(attachmentIds)];
    const rows = await this.attachments.find({
      where: {
        conversationId,
        id: In(uniqueIds),
        ownerUserId,
        tenantId,
      },
    });

    if (rows.length !== uniqueIds.length) {
      throw new BadRequestException('Invalid input.');
    }

    for (const row of rows) {
      if (row.messageId !== null) {
        throw new BadRequestException('Invalid input.');
      }

      if (row.expiresAt.getTime() <= now.getTime()) {
        throw new BadRequestException('Invalid input.');
      }
    }

    await this.attachments.update(
      { id: In(uniqueIds), tenantId },
      { messageId, updatedAt: now },
    );
  }

  async resolveForMessage(
    tenantId: string,
    messageId: string,
  ): Promise<ResolvedAiAttachment[]> {
    const rows = await this.attachments.find({
      where: { messageId, tenantId },
    });

    const resolved: ResolvedAiAttachment[] = [];

    for (const row of rows) {
      if (row.expiresAt.getTime() <= Date.now()) {
        continue;
      }

      try {
        const bytes = await this.tenantStorage.readTenantFile(
          tenantId,
          row.storagePointer,
          'ai',
        );
        resolved.push({
          bytes,
          mimeType: row.mimeType,
          originalName: row.originalName,
        });
      } catch {
        this.logger.warn(`ai_attachment_missing ${row.id}`);
      }
    }

    return resolved;
  }

  async deleteForConversation(
    tenantId: string,
    conversationId: string,
  ): Promise<void> {
    const rows = await this.attachments.find({
      where: { conversationId, tenantId },
    });

    for (const row of rows) {
      try {
        await this.tenantStorage.deleteTenantFile(
          tenantId,
          row.storagePointer,
          'ai',
        );
      } catch {
        this.logger.warn(`ai_attachment_delete_file_failed ${row.id}`);
      }
    }

    if (rows.length > 0) {
      await this.attachments.delete({ conversationId, tenantId });
    }
  }

  async purgeExpired(now = new Date()): Promise<void> {
    const expired = await this.attachments.find({
      take: 200,
      where: { expiresAt: LessThanOrEqual(now) },
    });

    for (const row of expired) {
      try {
        await this.tenantStorage.deleteTenantFile(
          row.tenantId,
          row.storagePointer,
          'ai',
        );
      } catch {
        this.logger.warn(`ai_attachment_purge_file_failed ${row.id}`);
      }
    }

    if (expired.length > 0) {
      await this.attachments.delete({ id: In(expired.map((row) => row.id)) });
    }
  }

  private async assertAgentAccess(session: AuthenticatedUser): Promise<void> {
    const user = await this.users.findOne({ where: { id: session.id } });

    if (!user || user.status !== 'active') {
      throw new ForbiddenException('Access denied.');
    }

    if (
      !hasMappedAction(
        {
          enabledActions: user.enabledActions ?? [],
          profile: user.profile,
        },
        'vetorAgent',
      )
    ) {
      throw new ForbiddenException('Access denied.');
    }
  }

  private toView(row: AiAttachment): AiAttachmentView {
    return {
      conversationId: row.conversationId,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      id: row.id,
      mimeType: row.mimeType,
      originalName: row.originalName,
    };
  }
}

function sanitizeOriginalName(name: string): string {
  const trimmed = name.trim().replace(/[/\\]/g, '_');

  if (trimmed.length === 0) {
    return 'arquivo';
  }

  return trimmed.slice(0, 255);
}
