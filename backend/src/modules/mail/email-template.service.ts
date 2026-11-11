import { Injectable } from '@nestjs/common';

export interface EmailContent {
  html: string;
  text: string;
}

@Injectable()
export class EmailTemplateService {
  renderContact(
    name: string,
    email: string,
    description: string,
  ): EmailContent {
    return {
      html: this.layout(
        'Novo contato pelo site VETOR',
        `<p>Um novo contato foi enviado pelo site VETOR.</p>
         <p><strong>Nome do cliente:</strong> ${this.escape(name)}</p>
         <p><strong>E-mail do cliente:</strong> ${this.escape(email)}</p>
         <p><strong>Descrição do projeto:</strong></p>
         <p>${this.escape(description).replace(/\n/g, '<br />')}</p>`,
      ),
      text: [
        'Novo contato pelo site VETOR',
        '',
        `Nome do cliente: ${name}`,
        `E-mail do cliente: ${email}`,
        '',
        'Descrição do projeto:',
        description,
      ].join('\n'),
    };
  }

  renderPasswordReset(token: string): EmailContent {
    return {
      html: this.layout(
        'Recuperação de senha do Portal Vector',
        `<p>Recebemos uma solicitação para redefinir sua senha.</p>
         <p>Use o token abaixo na página de login, em Esqueci minha senha:</p>
         <p style="font-size: 24px; letter-spacing: 0.2em; font-weight: 700;">${this.escape(token)}</p>
         <p>Este token expira em 15 minutos e pode ser usado uma única vez.</p>`,
      ),
      text: [
        'Recuperação de senha do Portal Vector',
        '',
        'Use o token abaixo na página de login, em Esqueci minha senha:',
        token,
        '',
        'Este token expira em 15 minutos e pode ser usado uma única vez.',
      ].join('\n'),
    };
  }

  renderPasswordChanged(): EmailContent {
    return {
      html: this.layout(
        'Senha alterada com sucesso - Portal Vector',
        '<p>Sua senha foi alterada com sucesso.</p><p>Se você não realizou esta alteração, entre em contato com a VETOR.</p>',
      ),
      text: [
        'Senha alterada com sucesso - Portal Vector',
        '',
        'Sua senha foi alterada com sucesso.',
        'Se você não realizou esta alteração, entre em contato com a VETOR.',
      ].join('\n'),
    };
  }

  renderPasswordResetLink(changeUrl: string): EmailContent {
    const safeUrl = this.escape(changeUrl);
    const sentence =
      'Altere a senha pelo link abaixo. O link expira em 30 minutos. Depois que a senha é alterada, o mesmo link deixa de valer.';

    return {
      html: this.layout(
        'Altere a senha',
        `<p>${sentence}</p>
         <p><a href="${safeUrl}">${safeUrl}</a></p>`,
      ),
      text: ['Altere a senha', '', sentence, changeUrl].join('\n'),
    };
  }

  renderPasswordChangeInvitation(changeUrl: string): EmailContent {
    const safeUrl = this.escape(changeUrl);

    return {
      html: this.layout(
        'Altere a senha',
        `<p>Altere a senha pelo link abaixo. O link expira conforme a política do Portal Vector e pode ser usado uma única vez.</p>
         <p><a href="${safeUrl}">${safeUrl}</a></p>`,
      ),
      text: [
        'Altere a senha',
        '',
        'Altere a senha pelo link abaixo. O link expira conforme a política do Portal Vector e pode ser usado uma única vez.',
        changeUrl,
      ].join('\n'),
    };
  }

  renderTicketNotice(
    event: string,
    ticketId: string,
    link: string,
  ): EmailContent {
    const safeLink = this.escape(link);

    return {
      html: this.layout(
        event,
        `<p>Evento: ${this.escape(event)}</p>
         <p>Chamado: ${this.escape(ticketId)}</p>
         <p><a href="${safeLink}">${safeLink}</a></p>`,
      ),
      text: [event, '', `Chamado: ${ticketId}`, link].join('\n'),
    };
  }

  renderMfaCode(token: string, expiresIn: string): EmailContent {
    const safeToken = this.escape(token);

    return {
      html: this.layout(
        'Código de autenticação do Portal Vector',
        `<p>Este é o processo de autenticação múltipla, para fortalecer o acesso ao portal. Copie o código abaixo e cole no campo do portal.</p>
         <p style="font-size: 24px; letter-spacing: 0.2em; font-weight: 700;">
           <span id="mfa-code">${safeToken}</span>
           <button type="button" style="margin-left: 16px; background:#BDDA2B; color:#060B18; border:0; border-radius:999px; padding:10px 18px; font-weight:700; font-family: Arial, sans-serif; letter-spacing: 0; font-size: 14px; cursor:pointer;" onclick="var code=document.getElementById('mfa-code');var button=this;if(code&&navigator.clipboard){navigator.clipboard.writeText(code.textContent||'').then(function(){button.textContent='Copiado';});}">Copiar</button>
         </p>
         <p>Este código expira em ${this.escape(expiresIn)} e pode ser usado uma única vez.</p>`,
      ),
      text: [
        'Código de autenticação do Portal Vector',
        '',
        'Este é o processo de autenticação múltipla, para fortalecer o acesso ao portal. Copie o código abaixo e cole no campo do portal.',
        token,
        '',
        'Copiar',
        '',
        `Este código expira em ${expiresIn} e pode ser usado uma única vez.`,
      ].join('\n'),
    };
  }

  private layout(title: string, content: string): string {
    return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#f8f9fc;color:#0d1321;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 18px;text-align:center;">
                <img src="cid:vetor-logo" alt="VETOR" width="220" style="display:block;max-width:100%;height:auto;margin:0 auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 36px;">
                <h1 style="font-size:24px;line-height:1.2;margin:0 0 20px;color:#0d1321;">${this.escape(title)}</h1>
                <div style="font-size:16px;line-height:1.6;color:#4a5267;">${content}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#060b18;color:#f0f2f7;text-align:center;font-size:12px;line-height:1.5;">
                VETOR — Business &amp; Technology<br />
                contato@vetor.tech
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
