import { vi } from 'vitest';
import { resolve } from 'node:path';
import { EmailTemplateService } from './email-template.service.js';

const { sendMail, verify } = vi.hoisted(() => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
  verify: vi.fn().mockResolvedValue(true),
}));

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({ sendMail, verify })),
}));

import { MailService } from './mail.service.js';

describe('MailService', () => {
  beforeEach(() => {
    sendMail.mockClear();
    verify.mockClear();
  });

  it('sends contact notifications to the backend-only configured recipient', async () => {
    const values: Record<string, string> = {
      MAIL_FROM: 'noreply@example.com',
      MAIL_HOST: 'smtp.example.com',
      MAIL_PASSWORD: 'password',
      MAIL_PORT: '587',
      MAIL_SECURE: 'false',
      MAIL_USER: 'user',
      FORM_CONTACT: 'contato@example.com',
    };
    const config = {
      get: vi.fn((key: string) => values[key]),
      getOrThrow: vi.fn((key: string) => values[key]),
    };
    const service = new MailService(
      config as never,
      new EmailTemplateService(),
    );

    await service.sendContact('Ana', 'ana@example.com', 'Projeto');

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@example.com',
        replyTo: 'ana@example.com',
        subject: 'Novo contato pelo site VETOR',
        to: 'contato@example.com',
      }),
    );
    expect(sendMail.mock.calls[0][0].attachments[0].cid).toBe('vetor-logo');
  });

  it('verifies SMTP without sending mail', async () => {
    const values: Record<string, string> = {
      MAIL_FROM: 'noreply@example.com',
      MAIL_HOST: 'smtp.example.com',
      MAIL_PASSWORD: 'password',
      MAIL_PORT: '587',
      MAIL_SECURE: 'false',
      MAIL_USER: 'user',
    };
    const config = {
      get: vi.fn((key: string) => values[key]),
      getOrThrow: vi.fn((key: string) => values[key]),
    };
    const service = new MailService(
      config as never,
      new EmailTemplateService(),
    );

    await expect(service.verifyTransport()).resolves.toBe(true);
    expect(verify).toHaveBeenCalledOnce();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sends Altere a senha with the change-password link', async () => {
    const values: Record<string, string> = {
      MAIL_FROM: 'noreply@example.com',
      MAIL_HOST: 'smtp.example.com',
      MAIL_PASSWORD: 'password',
      MAIL_PORT: '587',
      MAIL_SECURE: 'false',
      MAIL_USER: 'user',
    };
    const config = {
      get: vi.fn((key: string) => values[key]),
      getOrThrow: vi.fn((key: string) => values[key]),
    };
    const service = new MailService(
      config as never,
      new EmailTemplateService(),
    );

    await service.sendPasswordChangeInvitation(
      'nova@example.com',
      'http://localhost:3000/portal/change-password?token=abc',
    );

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Altere a senha',
        to: 'nova@example.com',
      }),
    );
    expect(sendMail.mock.calls[0][0].html).toContain(
      'portal/change-password?token=abc',
    );
    expect(sendMail.mock.calls[0][0].text).toContain(
      'conforme a política do Portal Vector',
    );
  });

  it('sends the 30-minute reset link with subject Altere a senha', async () => {
    const values: Record<string, string> = {
      MAIL_FROM: 'noreply@example.com',
      MAIL_HOST: 'smtp.example.com',
      MAIL_PASSWORD: 'password',
      MAIL_PORT: '587',
      MAIL_SECURE: 'false',
      MAIL_USER: 'user',
    };
    const config = {
      get: vi.fn((key: string) => values[key]),
      getOrThrow: vi.fn((key: string) => values[key]),
    };
    const service = new MailService(
      config as never,
      new EmailTemplateService(),
    );

    await service.sendPasswordResetLink(
      'ana@example.com',
      'http://localhost:3000/portal/change-password?token=abc',
    );

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Altere a senha',
        to: 'ana@example.com',
      }),
    );
    expect(sendMail.mock.calls.at(-1)?.[0].text).toContain(
      'O link expira em 30 minutos.',
    );
  });

  it('sends the MFA subject and keeps the code out of a link', async () => {
    const values: Record<string, string> = {
      MAIL_FROM: 'noreply@example.com',
      MAIL_HOST: 'smtp.example.com',
      MAIL_PASSWORD: 'password',
      MAIL_PORT: '587',
      MAIL_SECURE: 'false',
      MAIL_USER: 'user',
    };
    const config = {
      get: vi.fn((key: string) => values[key]),
      getOrThrow: vi.fn((key: string) => values[key]),
    };
    const service = new MailService(
      config as never,
      new EmailTemplateService(),
    );

    await service.sendMfaCode('ana@example.com', '0042', '30 minutos');

    const message = sendMail.mock.calls[0][0] as {
      html: string;
      subject: string;
      text: string;
      to: string;
    };
    expect(message.subject).toBe('Código de autenticação do Portal Vector');
    expect(message.to).toBe('ana@example.com');
    expect(message.text.split('\n')).toContain('0042');
    expect(message.text).toContain(
      'Este código expira em 30 minutos e pode ser usado uma única vez.',
    );
    expect(message.html).toContain('>Copiar</button>');
    expect(message.html).not.toMatch(/href=["'][^"']*0042/);
  });

  it('sends one ticket notice per recipient without the description or comment', async () => {
    const values: Record<string, string> = {
      MAIL_FROM: 'noreply@example.com',
      MAIL_HOST: 'smtp.example.com',
      MAIL_PASSWORD: 'password',
      MAIL_PORT: '587',
      MAIL_SECURE: 'false',
      MAIL_USER: 'user',
    };
    const config = {
      get: vi.fn((key: string) => values[key]),
      getOrThrow: vi.fn((key: string) => values[key]),
    };
    const service = new MailService(
      config as never,
      new EmailTemplateService(),
    );
    const ticketId = '11111111-1111-4111-8111-111111111111';

    await service.sendTicketNotice(
      ['ana@example.com', 'bia@example.com'],
      'Novo comentário da empresa',
      ticketId,
      `http://localhost:3000/portal/chamados/${ticketId}`,
    );

    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail.mock.calls[0][0].to).toBe('ana@example.com');
    expect(sendMail.mock.calls[1][0].to).toBe('bia@example.com');
    expect(sendMail.mock.calls[0][0].subject).toBe(
      'Novo comentário da empresa',
    );
    expect(sendMail.mock.calls[0][0].text).not.toContain('senha vazada');
    expect(sendMail.mock.calls[0][0].html).toContain(
      `/portal/chamados/${ticketId}`,
    );
  });

  it('loads the email logo when the process cwd is the monorepo root', () => {
    const values: Record<string, string> = {
      MAIL_FROM: 'noreply@example.com',
      MAIL_HOST: 'smtp.example.com',
      MAIL_PASSWORD: 'password',
      MAIL_PORT: '587',
      MAIL_SECURE: 'false',
      MAIL_USER: 'user',
    };
    const config = {
      get: vi.fn((key: string) => values[key]),
      getOrThrow: vi.fn((key: string) => values[key]),
    };
    const previousCwd = process.cwd();
    process.chdir(resolve(previousCwd, '..'));

    try {
      expect(
        () =>
          new MailService(config as never, new EmailTemplateService()),
      ).not.toThrow();
    } finally {
      process.chdir(previousCwd);
    }
  });
});
