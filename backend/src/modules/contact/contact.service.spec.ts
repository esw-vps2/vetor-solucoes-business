import { ContactService } from './contact.service.js';

describe('ContactService', () => {
  it('normalizes contact fields before sending the inquiry', async () => {
    const mail = {
      sendContact: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ContactService(mail as never);

    await service.send({
      customerEmail: ' ANA@EXAMPLE.COM ',
      customerName: ' Ana ',
      projectDescription: ' Descrição do projeto ',
    });

    expect(mail.sendContact).toHaveBeenCalledWith(
      'Ana',
      'ana@example.com',
      'Descrição do projeto',
    );
  });
});
