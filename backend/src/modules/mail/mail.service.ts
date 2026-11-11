import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EmailTemplateService } from './email-template.service.js';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;
  private readonly logoPath: string;

  constructor(
    private readonly config: ConfigService,
    private readonly templates: EmailTemplateService,
  ) {
    this.transporter = createTransport({
      auth: {
        pass: this.config.get<string>('MAIL_PASSWORD'),
        user: this.config.get<string>('MAIL_USER'),
      },
      host: this.config.get<string>('MAIL_HOST'),
      port: Number(this.config.get<string>('MAIL_PORT', '587')),
      secure: this.config.get<string>('MAIL_SECURE') === 'true',
    });
    this.logoPath = this.findLogoPath();
  }

  async sendContact(
    name: string,
    email: string,
    description: string,
  ): Promise<void> {
    const content = this.templates.renderContact(name, email, description);

    await this.transporter.sendMail({
      attachments: [
        { cid: 'vetor-logo', filename: 'logo_vetor.png', path: this.logoPath },
      ],
      from: this.config.getOrThrow<string>('MAIL_FROM'),
      html: content.html,
      replyTo: email,
      subject: 'Novo contato pelo site VETOR',
      text: content.text,
      to: this.config.getOrThrow<string>('FORM_CONTACT'),
    });
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const content = this.templates.renderPasswordReset(token);

    await this.transporter.sendMail({
      attachments: [
        { cid: 'vetor-logo', filename: 'logo_vetor.png', path: this.logoPath },
      ],
      from: this.config.getOrThrow<string>('MAIL_FROM'),
      html: content.html,
      subject: 'Recuperação de senha do Portal Vector',
      text: content.text,
      to: email,
    });
  }

  async sendMfaCode(
    email: string,
    token: string,
    expiresIn: string,
  ): Promise<void> {
    const content = this.templates.renderMfaCode(token, expiresIn);

    await this.transporter.sendMail({
      attachments: [
        { cid: 'vetor-logo', filename: 'logo_vetor.png', path: this.logoPath },
      ],
      from: this.config.getOrThrow<string>('MAIL_FROM'),
      html: content.html,
      subject: 'Código de autenticação do Portal Vector',
      text: content.text,
      to: email,
    });
  }

  async verifyTransport(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  async sendPasswordResetLink(email: string, changeUrl: string): Promise<void> {
    const content = this.templates.renderPasswordResetLink(changeUrl);

    await this.transporter.sendMail({
      attachments: [
        { cid: 'vetor-logo', filename: 'logo_vetor.png', path: this.logoPath },
      ],
      from: this.config.getOrThrow<string>('MAIL_FROM'),
      html: content.html,
      subject: 'Altere a senha',
      text: content.text,
      to: email,
    });
  }

  async sendPasswordChangeInvitation(
    email: string,
    changeUrl: string,
  ): Promise<void> {
    const content = this.templates.renderPasswordChangeInvitation(changeUrl);

    await this.transporter.sendMail({
      attachments: [
        { cid: 'vetor-logo', filename: 'logo_vetor.png', path: this.logoPath },
      ],
      from: this.config.getOrThrow<string>('MAIL_FROM'),
      html: content.html,
      subject: 'Altere a senha',
      text: content.text,
      to: email,
    });
  }

  async sendTicketNotice(
    recipients: string[],
    event: string,
    ticketId: string,
    link: string,
  ): Promise<void> {
    const content = this.templates.renderTicketNotice(event, ticketId, link);
    const from = this.config.getOrThrow<string>('MAIL_FROM');

    await Promise.all(
      recipients.map((recipient) =>
        this.transporter.sendMail({
          attachments: [
            {
              cid: 'vetor-logo',
              filename: 'logo_vetor.png',
              path: this.logoPath,
            },
          ],
          from,
          html: content.html,
          subject: event,
          text: content.text,
          to: recipient,
        }),
      ),
    );
  }

  async sendPasswordChanged(email: string): Promise<void> {
    const content = this.templates.renderPasswordChanged();

    await this.transporter.sendMail({
      attachments: [
        { cid: 'vetor-logo', filename: 'logo_vetor.png', path: this.logoPath },
      ],
      from: this.config.getOrThrow<string>('MAIL_FROM'),
      html: content.html,
      subject: 'Senha alterada com sucesso - Portal Vector',
      text: content.text,
      to: email,
    });
  }

  private findLogoPath(): string {
    const moduleDir = dirname(fileURLToPath(import.meta.url));
    const candidates = [
      join(moduleDir, 'assets/logo_vetor.png'),
      resolve(process.cwd(), 'dist/modules/mail/assets/logo_vetor.png'),
      resolve(process.cwd(), 'src/modules/mail/assets/logo_vetor.png'),
      resolve(process.cwd(), 'backend/dist/modules/mail/assets/logo_vetor.png'),
      resolve(process.cwd(), 'backend/src/modules/mail/assets/logo_vetor.png'),
      resolve(process.cwd(), '../frontend/public/brand/logo_vetor.png'),
    ];
    const path = candidates.find((candidate) => existsSync(candidate));

    if (!path) {
      throw new Error('VETOR email logo asset is missing.');
    }

    return path;
  }
}
