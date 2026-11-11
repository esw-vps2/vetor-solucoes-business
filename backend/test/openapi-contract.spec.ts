import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const openApiPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../openapi.yaml',
);

const requiredPaths = [
  '/api/v1:',
  '/api/v1/contact:',
  '/api/v1/auth/login:',
  '/api/v1/auth/mfa/verify:',
  '/api/v1/admin/tenant-settings:',
  '/api/v1/admin/tenant-settings/{tenantId}:',
  '/api/v1/auth/mfa/resend:',
  '/api/v1/auth/mfa/cancel:',
  '/api/v1/auth/refresh:',
  '/api/v1/auth/logout:',
  '/api/v1/auth/session:',
  '/api/v1/auth/password-recovery/request:',
  '/api/v1/auth/password-recovery/verify:',
  '/api/v1/auth/password-recovery/reset:',
  '/api/v1/tenants:',
  '/api/v1/tenants/{id}/photo:',
  '/api/v1/users:',
  '/api/v1/users/{id}:',
  '/api/v1/users/{id}/reactivate:',
  '/api/v1/users/{id}/password-reset-link:',
  '/api/v1/users/{id}/photo:',
  '/api/v1/powerbi/workspaces:',
  '/api/v1/powerbi/workspaces/{workspaceId}/reports:',
  '/api/v1/powerbi/workspaces/{workspaceId}/reports/{reportId}/pages:',
  '/api/v1/powerbi/relatorios:',
  '/api/v1/powerbi/relatorios/{id}:',
  '/api/v1/powerbi/relatorios/{id}/status:',
  '/api/v1/powerbi/relatorios/{id}/distribuicoes:',
  '/api/v1/powerbi/distribuicoes/{id}:',
  '/api/v1/powerbi/distribuicoes/{id}/status:',
  '/api/v1/powerbi/meus-relatorios:',
  '/api/v1/powerbi/meus-relatorios/{distribuicaoId}/embed-token:',
  '/api/v1/project-workspaces:',
  '/api/v1/project-workspaces/{id}:',
  '/api/v1/project-workspaces/{workspaceId}/projects:',
  '/api/v1/projects/{id}:',
  '/api/v1/finance/projects:',
  '/api/v1/finance/projects/{projectId}/documents:',
  '/api/v1/finance/projects/{projectId}/documents/{documentId}:',
  '/api/v1/finance/projects/{projectId}:',
  '/api/v1/finance/tenants/{tenantId}/notes:',
  '/api/v1/finance/tenants/{tenantId}/notes/{noteId}:',
  '/api/v1/projects/{id}/finance:',
  '/api/v1/projects/{id}/contract:',
  '/api/v1/projects/{id}/contract/file:',
  '/api/v1/projects/{id}/payments:',
  '/api/v1/projects/{id}/payments/{paymentId}:',
  '/api/v1/projects/{id}/costs:',
  '/api/v1/projects/{id}/costs/{costId}:',
  '/api/v1/projects/{id}/cost-lines:',
  '/api/v1/projects/{id}/cards:',
  '/api/v1/projects/{id}/background:',
  '/api/v1/projects/{id}/documents:',
  '/api/v1/projects/{id}/documents/{documentId}:',
  '/api/v1/projects/{id}/documents/{documentId}/archive:',
  '/api/v1/cards/{id}:',
  '/api/v1/cards/{id}/move:',
  '/api/v1/cards/{id}/place:',
  '/api/v1/cards/{id}/reorder:',
  '/api/v1/cards/{id}/comments:',
  '/api/v1/tickets:',
  '/api/v1/tickets/{id}:',
  '/api/v1/tickets/{id}/comments:',
  '/api/v1/tickets/{id}/read:',
  '/api/v1/tickets/{id}/attachments:',
  '/api/v1/tickets/{id}/attachments/{attachmentId}:',
  '/api/v1/expenses:',
  '/api/v1/expenses/associations:',
  '/api/v1/expenses/cancel:',
  '/api/v1/expenses/{id}:',
  '/api/v1/expenses/{id}/cancel:',
  '/api/v1/expenses/{id}/documents:',
  '/api/v1/expenses/{id}/documents/{documentId}:',
  '/api/v1/expense-categories:',
  '/api/v1/expense-categories/{id}:',
  '/api/v1/expense-categories/{id}/subcategories:',
  '/api/v1/expense-subcategories/{id}:',
  '/api/v1/expense-series/{id}/cancel:',
  '/api/v1/cards/{id}/comments/{commentId}:',
  '/api/v1/cards/{id}/checklist-items:',
  '/api/v1/cards/{id}/checklist-items/{itemId}:',
  '/api/v1/cards/{id}/attachments:',
  '/api/v1/cards/{id}/attachments/{attachmentId}:',
  '/api/v1/ai/pricing:',
  '/api/v1/ai/conversations:',
  '/api/v1/ai/conversations/{conversationId}/messages:',
  '/api/v1/ai/conversations/{conversationId}/attachments/{attachmentId}:',
  '/api/v1/ai/runs/{runId}:',
  '/api/v1/ai/runs/{runId}/events:',
];

describe('openapi.yaml', () => {
  const document = readFileSync(openApiPath, 'utf8');

  it('documents every published product endpoint', () => {
    for (const path of requiredPaths) {
      expect(document).toContain(path);
    }
  });

  it('uses non-production example.com placeholders', () => {
    expect(document).toContain('ana@example.com');
    expect(document).toContain('user@example.com');
    expect(document).toContain('ExamplePassword12');
    expect(document).not.toContain('vetor.tech');
    expect(document).not.toMatch(/MAIL_PASSWORD|JWT_SECRET|DATABASE_URL/);
  });
});
