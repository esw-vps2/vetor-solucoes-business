import { EmailTemplateService } from './email-template.service.js';

describe('EmailTemplateService', () => {
  it('renders a Portuguese contact email with escaped values and text fallback', () => {
    const service = new EmailTemplateService();
    const content = service.renderContact(
      'Ana <Teste>',
      'ana@example.com',
      'Projeto & dados',
    );

    expect(content.html).toContain('VETOR');
    expect(content.html).toContain('Ana &lt;Teste&gt;');
    expect(content.html).toContain('Projeto &amp; dados');
    expect(content.html).toContain('cid:vetor-logo');
    expect(content.text).toContain('Projeto & dados');
  });

  it('renders a ticket notice with the event, identifier, and link only', () => {
    const service = new EmailTemplateService();
    const content = service.renderTicketNotice(
      'Novo chamado',
      '11111111-1111-4111-8111-111111111111',
      'http://localhost:3000/portal/chamados/11111111-1111-4111-8111-111111111111',
    );

    expect(content.text).toContain('Novo chamado');
    expect(content.text).toContain('11111111-1111-4111-8111-111111111111');
    expect(content.html).toContain('/portal/chamados/');
    expect(content.text).not.toContain('description');
    expect(content.html).not.toContain('comment body');
  });

  it('renders password recovery and password change messages', () => {
    const service = new EmailTemplateService();

    expect(service.renderPasswordReset('a'.repeat(64)).text).toContain(
      'a'.repeat(64),
    );
    expect(service.renderPasswordReset('a'.repeat(64)).text).toContain(
      'Use o token abaixo na página de login, em Esqueci minha senha:',
    );
    expect(service.renderPasswordReset('a'.repeat(64)).html).not.toContain(
      'modal de recuperação',
    );
    expect(service.renderPasswordChanged().html).toContain(
      'Senha alterada com sucesso',
    );
    expect(
      service.renderPasswordChangeInvitation(
        'http://localhost:3000/portal/change-password?token=abc',
      ).html,
    ).toContain('Altere a senha');
    expect(
      service.renderPasswordChangeInvitation(
        'http://localhost:3000/portal/change-password?token=abc',
      ).text,
    ).toContain('http://localhost:3000/portal/change-password?token=abc');
    expect(
      service.renderPasswordChangeInvitation(
        'http://localhost:3000/portal/change-password?token=abc',
      ).text,
    ).toContain('conforme a política do Portal Vector');
    const resetLink = service.renderPasswordResetLink(
      'http://localhost:3000/portal/change-password?token=abc',
    );
    expect(resetLink.text).toContain(
      'Altere a senha pelo link abaixo. O link expira em 30 minutos. Depois que a senha é alterada, o mesmo link deixa de valer.',
    );
    expect(resetLink.html).toContain(
      'http://localhost:3000/portal/change-password?token=abc',
    );
    expect(resetLink.text).not.toContain(
      'conforme a política do Portal Vector',
    );
  });

  it('renders the MFA code as selectable digits with a copy control and no token link', () => {
    const service = new EmailTemplateService();
    const token = '0042';
    const content = service.renderMfaCode(token, '30 minutos');

    expect(content.html).toContain('Código de autenticação do Portal Vector');
    expect(content.html).toContain(
      'Este é o processo de autenticação múltipla, para fortalecer o acesso ao portal. Copie o código abaixo e cole no campo do portal.',
    );
    expect(content.html).toContain(`<span id="mfa-code">${token}</span>`);
    expect(content.html).toContain(
      '<p style="font-size: 24px; letter-spacing: 0.2em; font-weight: 700;">',
    );
    expect(content.html).not.toContain('monospace');
    expect(content.html).toContain('>Copiar</button>');
    expect(content.html).toContain('Copiado');
    expect(content.html).not.toContain(`href=`);
    expect(content.text).toContain(token);
    expect(content.text).toContain('Copiar');
    expect(content.text).toContain(
      'Este código expira em 30 minutos e pode ser usado uma única vez.',
    );
    expect(token).toMatch(/^[0-9]+$/);
  });
});
