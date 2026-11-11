import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../portal/auth.types.js';
import { Tenant } from '../portal/entities/tenant.entity.js';
import { User } from '../portal/entities/user.entity.js';
import {
  MAX_TENANT_NOTES,
  type TenantNoteDto,
  type UpsertTenantNoteDto,
} from './dto/tenant-note.dto.js';
import { TenantNote } from './entities/tenant-note.entity.js';
import {
  decryptNote,
  encryptNote,
  noteKeyFromBase64,
} from './note-cipher.js';

@Injectable()
export class TenantNotesService {
  constructor(
    @InjectRepository(TenantNote)
    private readonly notes: Repository<TenantNote>,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async list(
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<TenantNoteDto[]> {
    await this.requireAdministrador(actor);
    await this.requireTenant(tenantId);
    const key = this.requireNoteKey();
    const rows = await this.notes.find({
      order: { updatedAt: 'DESC' },
      where: { tenantId },
    });

    return rows.map((row) => this.toDto(row, key));
  }

  async create(
    actor: AuthenticatedUser,
    tenantId: string,
    dto: UpsertTenantNoteDto,
  ): Promise<TenantNoteDto> {
    const user = await this.requireAdministrador(actor);
    await this.requireTenant(tenantId);
    const key = this.requireNoteKey();
    const count = await this.notes.count({ where: { tenantId } });

    if (count >= MAX_TENANT_NOTES) {
      throw new BadRequestException('Invalid input.');
    }

    const sealed = encryptNote(key, { body: dto.body, title: dto.title });
    const saved = await this.notes.save(
      this.notes.create({
        authTag: sealed.authTag,
        ciphertext: sealed.ciphertext,
        createdByUserId: user.id,
        iv: sealed.iv,
        tenantId,
      }),
    );

    return this.toDto(saved, key);
  }

  async update(
    actor: AuthenticatedUser,
    tenantId: string,
    noteId: string,
    dto: UpsertTenantNoteDto,
  ): Promise<TenantNoteDto> {
    await this.requireAdministrador(actor);
    await this.requireTenant(tenantId);
    const key = this.requireNoteKey();
    const note = await this.requireNote(tenantId, noteId);
    const sealed = encryptNote(key, { body: dto.body, title: dto.title });
    note.authTag = sealed.authTag;
    note.ciphertext = sealed.ciphertext;
    note.iv = sealed.iv;
    const saved = await this.notes.save(note);

    return this.toDto(saved, key);
  }

  async remove(
    actor: AuthenticatedUser,
    tenantId: string,
    noteId: string,
  ): Promise<void> {
    await this.requireAdministrador(actor);
    await this.requireTenant(tenantId);
    this.requireNoteKey();
    const note = await this.requireNote(tenantId, noteId);
    await this.notes.remove(note);
  }

  private async requireAdministrador(actor: AuthenticatedUser): Promise<User> {
    const user = await this.users.findOne({
      where: { id: actor.id, status: 'active' },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.profile !== 'Administrador') {
      throw new ForbiddenException('Access denied.');
    }

    return user;
  }

  private async requireTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });

    if (!tenant) {
      throw new NotFoundException('Not found.');
    }

    return tenant;
  }

  private async requireNote(
    tenantId: string,
    noteId: string,
  ): Promise<TenantNote> {
    const note = await this.notes.findOne({
      where: { id: noteId, tenantId },
    });

    if (!note) {
      throw new NotFoundException('Not found.');
    }

    return note;
  }

  private requireNoteKey(): Buffer {
    try {
      return noteKeyFromBase64(this.config.get<string>('NOTES_ENCRYPTION_KEY'));
    } catch {
      throw new ServiceUnavailableException('Invalid input.');
    }
  }

  private toDto(note: TenantNote, key: Buffer): TenantNoteDto {
    const plaintext = decryptNote(key, {
      authTag: note.authTag,
      ciphertext: note.ciphertext,
      iv: note.iv,
    });

    return {
      body: plaintext.body,
      id: note.id,
      title: plaintext.title,
      updatedAt: note.updatedAt.toISOString(),
    };
  }
}
