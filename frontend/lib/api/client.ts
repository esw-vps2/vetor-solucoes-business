import { publicApiBaseUrl } from '../public-api-url';

const apiBaseUrl = publicApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_API_PROXY,
);

export interface ApiErrorBody {
  message?: string | string[];
  runId?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly runId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ContactPayload {
  customerName: string;
  customerEmail: string;
  projectDescription: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RecoveryContext {
  email: string;
}

export interface RecoveryTokenPayload {
  email?: string;
  token: string;
}

export interface ResetPasswordPayload extends RecoveryTokenPayload {
  password: string;
  passwordConfirmation: string;
}

export interface SafeUser {
  id: string;
  email: string;
  profile: string;
  firstName: string;
  lastName: string;
  cargo?: string;
  age: number;
  sex: string;
  photoUrl: string;
  tenantId: string;
  tenantName: string;
  tenantPhotoUrl?: string;
  tenantSlug: string;
  enabledActions: string[];
}

export interface EditableUser extends SafeUser {
  status: string;
}

export interface MfaChallenge {
  challengeId: string;
  expiresAt: string;
  mfaRequired: true;
}

export interface LoginSession extends SafeUser {
  mfaRequired: false;
}

export type LoginResult = MfaChallenge | LoginSession;

export interface TenantMfaSetting {
  id: string;
  name: string;
  slug: string;
  mfaEnabled: boolean;
  aiTokenCostPerMillion: number;
}

export interface TenantListItem {
  id: string;
  name: string;
  slug: string;
}

export interface CreateTenantPayload {
  name: string;
  slug: string;
  email?: string;
}

export interface CreatedTenant {
  id: string;
  name: string;
  slug: string;
  email: string | null;
}

export interface CreateUserPayload {
  tenantId: string;
  firstName: string;
  lastName: string;
  cargo?: string;
  age: number;
  sex: 'M' | 'F' | 'O';
  email: string;
  password: string;
  enabledActions: string[];
  profile?: 'Administrador' | 'AdministradorTenant';
}

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  cargo?: string;
  age: number;
  sex: 'M' | 'F' | 'O';
  email: string;
  tenantId?: string;
}

export interface UserListItem {
  id: string;
  firstName: string;
  lastName: string;
  cargo?: string;
  email: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  profile: string;
  status: string;
  enabledActions: string[];
}

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function isPhotoFile(file: File): boolean {
  const type = file.type.toLowerCase();

  return (
    file.size <= MAX_PHOTO_BYTES &&
    type !== 'image/svg+xml' &&
    (type === '' || type.startsWith('image/'))
  );
}

function buildHeaders(init: RequestInit): Headers {
  const headers = new Headers(init.headers);

  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
}

export function publicPhotoSrc(photoUrl: string): string {
  if (photoUrl.startsWith('/api/')) {
    return `${apiBaseUrl}${photoUrl}`;
  }

  return photoUrl;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { retryOnUnauthorized?: boolean } = {},
): Promise<T> {
  const retryOnUnauthorized = options.retryOnUnauthorized ?? true;
  const response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers: buildHeaders(init),
  });

  if (response.status === 401 && retryOnUnauthorized && path !== '/auth/refresh') {
    const refreshResponse = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (refreshResponse.ok) {
      return apiRequest<T>(path, init, { retryOnUnauthorized: false });
    }
  }

  if (!response.ok) {
    const details = await readErrorBody(response);
    throw new ApiError(details.message, response.status, details.runId);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function getErrorMessage(response: Response): Promise<string> {
  return readErrorBody(response).then((details) => details.message);
}

function readErrorBody(
  response: Response,
): Promise<{ message: string; runId?: string }> {
  return response
    .json()
    .then((body: ApiErrorBody) => {
      const message = Array.isArray(body.message)
        ? body.message.join(' ')
        : (body.message ?? 'Não foi possível concluir a operação.');

      return {
        message,
        runId: typeof body.runId === 'string' ? body.runId : undefined,
      };
    })
    .catch(() => ({ message: 'Não foi possível concluir a operação.' }));
}

export function sendContact(payload: ContactPayload): Promise<void> {
  return apiRequest<void>(
    '/contact',
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
    { retryOnUnauthorized: false },
  );
}

export function login(payload: LoginPayload): Promise<LoginResult> {
  return apiRequest<LoginResult>(
    '/auth/login',
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
    { retryOnUnauthorized: false },
  );
}

export function verifyMfa(payload: { challengeId: string; token: string }): Promise<SafeUser> {
  return apiRequest<SafeUser>(
    '/auth/mfa/verify',
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
    { retryOnUnauthorized: false },
  );
}

export function resendMfa(payload: { challengeId: string }): Promise<MfaChallenge> {
  return apiRequest<MfaChallenge>(
    '/auth/mfa/resend',
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
    { retryOnUnauthorized: false },
  );
}

export function cancelMfa(payload: { challengeId: string }): Promise<void> {
  return apiRequest<void>(
    '/auth/mfa/cancel',
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
    { retryOnUnauthorized: false },
  );
}

export function getSession(): Promise<SafeUser> {
  return apiRequest<SafeUser>('/auth/session');
}

export function updateSessionTenant(tenantId: string): Promise<SafeUser> {
  return apiRequest<SafeUser>('/auth/session', {
    body: JSON.stringify({ tenantId }),
    method: 'PATCH',
  });
}

export function refreshSession(): Promise<SafeUser> {
  return apiRequest<SafeUser>(
    '/auth/refresh',
    {
      method: 'POST',
    },
    { retryOnUnauthorized: false },
  );
}

export function requestPasswordRecovery(payload: RecoveryContext): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    '/auth/password-recovery/request',
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
    { retryOnUnauthorized: false },
  );
}

export function verifyPasswordRecovery(payload: RecoveryTokenPayload): Promise<{ valid: true }> {
  return apiRequest<{ valid: true }>(
    '/auth/password-recovery/verify',
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
    { retryOnUnauthorized: false },
  );
}

export function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  return apiRequest<void>(
    '/auth/password-recovery/reset',
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
    { retryOnUnauthorized: false },
  );
}

export function logout(): Promise<void> {
  return apiRequest<void>(
    '/auth/logout',
    {
      method: 'POST',
    },
    { retryOnUnauthorized: false },
  );
}

export function listTenants(): Promise<TenantListItem[]> {
  return apiRequest<TenantListItem[]>('/tenants');
}

export function listTenantMfaSettings(): Promise<TenantMfaSetting[]> {
  return apiRequest<TenantMfaSetting[]>('/admin/tenant-settings');
}

export interface AiTokenPricing {
  aiTokenCostPerMillion: number;
}

export function getAdminAiPricing(): Promise<AiTokenPricing> {
  return apiRequest<AiTokenPricing>('/admin/ai-pricing');
}

export function updateAdminAiPricing(
  aiTokenCostPerMillion: number,
): Promise<AiTokenPricing> {
  return apiRequest<AiTokenPricing>('/admin/ai-pricing', {
    body: JSON.stringify({ aiTokenCostPerMillion }),
    method: 'PATCH',
  });
}

export function updateTenantMfaSetting(
  tenantId: string,
  payload: { mfaEnabled: boolean },
): Promise<TenantMfaSetting> {
  return apiRequest<TenantMfaSetting>(`/admin/tenant-settings/${tenantId}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  });
}

export function createTenant(payload: CreateTenantPayload, photo?: File): Promise<CreatedTenant> {
  const body = new FormData();
  body.append('name', payload.name);
  body.append('slug', payload.slug);

  if (payload.email) {
    body.append('email', payload.email);
  }

  if (photo) {
    body.append('photo', photo);
  }

  return apiRequest<CreatedTenant>('/tenants', {
    body,
    method: 'POST',
  });
}

export function tenantPhotoApiPath(tenantId: string): string {
  return `/api/v1/tenants/${tenantId}/photo`;
}

export function replaceTenantPhoto(tenantId: string, photo: File): Promise<void> {
  const body = new FormData();
  body.append('photo', photo);

  return apiRequest<void>(`/tenants/${tenantId}/photo`, {
    body,
    method: 'PUT',
  });
}

export function deleteTenantPhoto(tenantId: string): Promise<void> {
  return apiRequest<void>(`/tenants/${tenantId}/photo`, {
    method: 'DELETE',
  });
}

export function createUser(payload: CreateUserPayload, photo?: File): Promise<void> {
  return apiRequest<void>('/users', {
    body: toUserFormData(payload, photo),
    method: 'POST',
  });
}

export function listUsers(): Promise<UserListItem[]> {
  return apiRequest<UserListItem[]>('/users');
}

export interface PowerBiWorkspace {
  id: string;
  name: string;
  isOnDedicatedCapacity?: boolean;
  isReadOnly?: boolean;
}

export interface PowerBiRemoteReport {
  id: string;
  name: string;
  datasetId?: string;
  embedUrl?: string;
}

export interface PowerBiPage {
  name: string;
  displayName: string;
  order?: number;
}

export interface PowerBiCatalogReport {
  id: string;
  workspaceId: string;
  reportId: string;
  datasetId: string;
  embedUrl: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface PowerBiDistribution {
  id: string;
  relatorioId: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  nomeExibicao: string | null;
  icone: string | null;
  ordem: number;
  paginaPadrao: string | null;
  ativo: boolean;
}

export interface PowerBiMyReport {
  id: string;
  nomeExibicao: string | null;
  icone: string | null;
  ordem: number;
  paginaPadrao: string | null;
  tenantId: string;
  relatorio: {
    id: string;
    nome: string;
    descricao: string | null;
  };
}

export interface PowerBiEmbedToken {
  id: string;
  nome: string;
  embedUrl: string;
  embedToken: string;
  expiration: string;
  paginaPadrao: string | null;
}

export function listPowerBiWorkspaces(): Promise<PowerBiWorkspace[]> {
  return apiRequest<PowerBiWorkspace[]>('/powerbi/workspaces');
}

export function listPowerBiWorkspaceReports(workspaceId: string): Promise<PowerBiRemoteReport[]> {
  return apiRequest<PowerBiRemoteReport[]>(`/powerbi/workspaces/${workspaceId}/reports`);
}

export function listPowerBiWorkspaceReportPages(
  workspaceId: string,
  reportId: string,
): Promise<PowerBiPage[]> {
  return apiRequest<PowerBiPage[]>(`/powerbi/workspaces/${workspaceId}/reports/${reportId}/pages`);
}

export function listPowerBiCatalog(): Promise<PowerBiCatalogReport[]> {
  return apiRequest<PowerBiCatalogReport[]>('/powerbi/relatorios');
}

export function importPowerBiReport(payload: {
  workspaceId: string;
  reportId: string;
  nome: string;
  descricao?: string;
}): Promise<PowerBiCatalogReport> {
  return apiRequest<PowerBiCatalogReport>('/powerbi/relatorios', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function updatePowerBiReport(
  id: string,
  payload: { nome?: string; descricao?: string },
): Promise<PowerBiCatalogReport> {
  return apiRequest<PowerBiCatalogReport>(`/powerbi/relatorios/${id}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  });
}

export function updatePowerBiReportStatus(
  id: string,
  ativo: boolean,
): Promise<PowerBiCatalogReport> {
  return apiRequest<PowerBiCatalogReport>(`/powerbi/relatorios/${id}/status`, {
    body: JSON.stringify({ ativo }),
    method: 'PATCH',
  });
}

export function listPowerBiDistributions(reportId: string): Promise<PowerBiDistribution[]> {
  return apiRequest<PowerBiDistribution[]>(`/powerbi/relatorios/${reportId}/distribuicoes`);
}

export function createPowerBiDistribution(
  reportId: string,
  payload: {
    tenantId: string;
    nomeExibicao?: string;
    icone?: string;
    ordem?: number;
    paginaPadrao?: string;
  },
): Promise<PowerBiDistribution> {
  return apiRequest<PowerBiDistribution>(`/powerbi/relatorios/${reportId}/distribuicoes`, {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function updatePowerBiDistribution(
  id: string,
  payload: {
    nomeExibicao?: string;
    icone?: string;
    ordem?: number;
    paginaPadrao?: string;
  },
): Promise<PowerBiDistribution> {
  return apiRequest<PowerBiDistribution>(`/powerbi/distribuicoes/${id}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  });
}

export function updatePowerBiDistributionStatus(
  id: string,
  ativo: boolean,
): Promise<PowerBiDistribution> {
  return apiRequest<PowerBiDistribution>(`/powerbi/distribuicoes/${id}/status`, {
    body: JSON.stringify({ ativo }),
    method: 'PATCH',
  });
}

export function listMyPowerBiReports(): Promise<PowerBiMyReport[]> {
  return apiRequest<PowerBiMyReport[]>('/powerbi/meus-relatorios');
}

export function createPowerBiEmbedToken(distribuicaoId: string): Promise<PowerBiEmbedToken> {
  return apiRequest<PowerBiEmbedToken>(`/powerbi/meus-relatorios/${distribuicaoId}/embed-token`, {
    method: 'POST',
  });
}

export function getUser(id: string): Promise<EditableUser> {
  return apiRequest<EditableUser>(`/users/${id}`);
}

export function reactivateUser(id: string): Promise<void> {
  return apiRequest<void>(`/users/${id}/reactivate`, {
    method: 'POST',
  });
}

export function sendPasswordResetLink(id: string): Promise<void> {
  return apiRequest<void>(`/users/${id}/password-reset-link`, {
    method: 'POST',
  });
}

export function updateUser(id: string, payload: UpdateUserPayload, photo?: File): Promise<void> {
  return apiRequest<void>(`/users/${id}`, {
    body: toUserFormData(payload, photo),
    method: 'PATCH',
  });
}

export function deleteUser(id: string): Promise<void> {
  return apiRequest<void>(`/users/${id}`, {
    method: 'DELETE',
  });
}

export function updateUserEnabledActions(
  id: string,
  enabledActions: string[],
  profile?: 'Usuario' | 'AdministradorTenant' | 'Administrador',
): Promise<void> {
  const body = new FormData();
  body.append('enabledActions', JSON.stringify(enabledActions));

  if (profile !== undefined) {
    body.append('profile', profile);
  }

  return apiRequest<void>(`/users/${id}`, {
    body,
    method: 'PATCH',
  });
}

function toUserFormData(payload: CreateUserPayload | UpdateUserPayload, photo?: File): FormData {
  const body = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value)) {
      body.append(key, JSON.stringify(value));
    } else {
      body.append(key, String(value));
    }
  }

  if (photo) {
    body.append('photo', photo);
  }

  return body;
}

export interface ProjectWorkspace {
  id: string;
  tenantId: string;
  name: string;
}

export interface ProjectSummary {
  id: string;
  workspaceId: string;
  name: string;
}

export interface CardComment {
  id: string;
  cardId: string;
  authorUserId: string;
  authorFirstName: string;
  authorLastName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardAttachment {
  id: string;
  cardId: string;
  contentType: string;
  byteSize: number;
  originalName: string;
  url: string;
  createdByUserId: string;
  createdByFirstName: string;
  createdByLastName: string;
}

export interface CardChecklistItem {
  id: string;
  cardId: string;
  body: string;
  done: boolean;
  position: number;
  createdByUserId: string;
}

export interface CardTag {
  name: string;
  color: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  parentId: string | null;
  kind: 'file' | 'folder';
  originalName: string;
  contentType: string | null;
  byteSize: number;
  createdByUserId: string;
  createdByFirstName: string;
  createdByLastName: string;
  url: string | null;
  children: ProjectDocument[];
}

export interface ProjectCard {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: string;
  createdByUserId: string;
  createdByFirstName: string;
  createdByLastName: string;
  createdAt: string;
  assigneeUserId: string | null;
  assigneeFirstName: string;
  assigneeLastName: string;
  assigneePhotoUrl: string | null;
  dueAt: string | null;
  startsAt: string | null;
  priority: string;
  lane: string;
  position: number;
  tags: CardTag[];
  coverAttachmentId: string | null;
  comments: CardComment[];
  attachments: CardAttachment[];
  checklistItems: CardChecklistItem[];
}

export interface KanbanFilterDate {
  mode: 'start' | 'end' | 'range';
  startDate: string | null;
  endDate: string | null;
}

export interface KanbanFilters {
  status: string[];
  date: KanbanFilterDate | null;
  taskCompletion: 'all' | 'complete' | 'incomplete';
}

export interface ProjectBoard {
  id: string;
  workspaceId: string;
  tenantId: string;
  name: string;
  kanbanFilters: KanbanFilters | null;
  backgroundUrl: string | null;
  lanes: { key: string; label?: string; color?: string; cards: ProjectCard[] }[];
  documents: ProjectDocument[];
}

export interface CreateCardPayload {
  title: string;
  description: string;
  assigneeUserId: string;
  dueAt?: string | null;
  startsAt?: string | null;
  priority?: string;
  tags?: CardTag[];
}

export interface UpdateCardPayload extends Partial<CreateCardPayload> {
  coverAttachmentId?: string | null;
}

export function listProjectWorkspaces(): Promise<ProjectWorkspace[]> {
  return apiRequest<ProjectWorkspace[]>('/project-workspaces');
}

export function createProjectWorkspace(name: string): Promise<ProjectWorkspace> {
  return apiRequest<ProjectWorkspace>('/project-workspaces', {
    body: JSON.stringify({ name }),
    method: 'POST',
  });
}

export function updateProjectWorkspace(id: string, name: string): Promise<ProjectWorkspace> {
  return apiRequest<ProjectWorkspace>(`/project-workspaces/${id}`, {
    body: JSON.stringify({ name }),
    method: 'PATCH',
  });
}

export function deleteProjectWorkspace(id: string): Promise<void> {
  return apiRequest<void>(`/project-workspaces/${id}`, { method: 'DELETE' });
}

export function listWorkspaceProjects(workspaceId: string): Promise<ProjectSummary[]> {
  return apiRequest<ProjectSummary[]>(`/project-workspaces/${workspaceId}/projects`);
}

export function createWorkspaceProject(workspaceId: string, name: string): Promise<ProjectSummary> {
  return apiRequest<ProjectSummary>(`/project-workspaces/${workspaceId}/projects`, {
    body: JSON.stringify({ name }),
    method: 'POST',
  });
}

export function getProjectBoard(id: string): Promise<ProjectBoard> {
  return apiRequest<ProjectBoard>(`/projects/${id}`);
}

export function updateProject(id: string, name: string): Promise<ProjectSummary> {
  return apiRequest<ProjectSummary>(`/projects/${id}`, {
    body: JSON.stringify({ name }),
    method: 'PATCH',
  });
}

export function updateProjectKanbanFilters(
  id: string,
  kanbanFilters: KanbanFilters,
): Promise<ProjectSummary> {
  return apiRequest<ProjectSummary>(`/projects/${id}`, {
    body: JSON.stringify({ kanbanFilters }),
    method: 'PATCH',
  });
}

export function updateProjectKanbanLanes(
  id: string,
  kanbanLanes: { key?: string; label: string }[],
): Promise<ProjectSummary> {
  return apiRequest<ProjectSummary>(`/projects/${id}`, {
    body: JSON.stringify({ kanbanLanes }),
    method: 'PATCH',
  });
}

export function deleteProject(id: string): Promise<void> {
  return apiRequest<void>(`/projects/${id}`, { method: 'DELETE' });
}

export function createProjectCard(
  projectId: string,
  payload: CreateCardPayload,
): Promise<ProjectCard> {
  return apiRequest<ProjectCard>(`/projects/${projectId}/cards`, {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function updateProjectCard(id: string, payload: UpdateCardPayload): Promise<ProjectCard> {
  return apiRequest<ProjectCard>(`/cards/${id}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  });
}

export function deleteProjectCard(id: string): Promise<void> {
  return apiRequest<void>(`/cards/${id}`, { method: 'DELETE' });
}

export function moveProjectCard(id: string, lane: string): Promise<ProjectCard> {
  return apiRequest<ProjectCard>(`/cards/${id}/move`, {
    body: JSON.stringify({ lane }),
    method: 'POST',
  });
}

export function placeProjectCard(id: string, lane: string, position: number): Promise<ProjectCard> {
  return apiRequest<ProjectCard>(`/cards/${id}/place`, {
    body: JSON.stringify({ lane, position }),
    method: 'POST',
  });
}

export function reorderProjectCard(id: string, direction: 'up' | 'down'): Promise<ProjectCard> {
  return apiRequest<ProjectCard>(`/cards/${id}/reorder`, {
    body: JSON.stringify({ direction }),
    method: 'POST',
  });
}

export function createCardComment(cardId: string, body: string): Promise<CardComment> {
  return apiRequest<CardComment>(`/cards/${cardId}/comments`, {
    body: JSON.stringify({ body }),
    method: 'POST',
  });
}

export function updateCardComment(
  cardId: string,
  commentId: string,
  body: string,
): Promise<CardComment> {
  return apiRequest<CardComment>(`/cards/${cardId}/comments/${commentId}`, {
    body: JSON.stringify({ body }),
    method: 'PATCH',
  });
}

export function deleteCardComment(cardId: string, commentId: string): Promise<void> {
  return apiRequest<void>(`/cards/${cardId}/comments/${commentId}`, { method: 'DELETE' });
}

export function addCardAttachment(cardId: string, file: File): Promise<CardAttachment> {
  const body = new FormData();
  body.append('file', file);
  return apiRequest<CardAttachment>(`/cards/${cardId}/attachments`, {
    body,
    method: 'POST',
  });
}

export function deleteCardAttachment(cardId: string, attachmentId: string): Promise<void> {
  return apiRequest<void>(`/cards/${cardId}/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
}

export function createChecklistItem(cardId: string, body: string): Promise<CardChecklistItem> {
  return apiRequest<CardChecklistItem>(`/cards/${cardId}/checklist-items`, {
    body: JSON.stringify({ body }),
    method: 'POST',
  });
}

export function updateChecklistItem(
  cardId: string,
  itemId: string,
  payload: { body?: string; done?: boolean },
): Promise<CardChecklistItem> {
  return apiRequest<CardChecklistItem>(`/cards/${cardId}/checklist-items/${itemId}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  });
}

export function deleteChecklistItem(cardId: string, itemId: string): Promise<void> {
  return apiRequest<void>(`/cards/${cardId}/checklist-items/${itemId}`, {
    method: 'DELETE',
  });
}

export function putProjectBackground(
  projectId: string,
  file: File,
): Promise<{ backgroundUrl: string | null }> {
  const body = new FormData();
  body.append('file', file);
  return apiRequest<{ backgroundUrl: string | null }>(`/projects/${projectId}/background`, {
    body,
    method: 'PUT',
  });
}

export function deleteProjectBackground(projectId: string): Promise<void> {
  return apiRequest<void>(`/projects/${projectId}/background`, { method: 'DELETE' });
}

export function createProjectFolder(
  projectId: string,
  name: string,
  parentId: string | null,
): Promise<ProjectDocument> {
  return apiRequest<ProjectDocument>(`/projects/${projectId}/documents`, {
    body: JSON.stringify({ kind: 'folder', name, parentId }),
    method: 'POST',
  });
}

export function uploadProjectDocuments(
  projectId: string,
  files: File[],
  parentId: string | null,
  relativePaths: string[],
): Promise<ProjectDocument[]> {
  const body = new FormData();
  for (const file of files) {
    body.append('files', file);
  }

  if (parentId) {
    body.append('parentId', parentId);
  }

  body.append('relativePaths', JSON.stringify(relativePaths));
  return apiRequest<ProjectDocument[]>(`/projects/${projectId}/documents`, {
    body,
    method: 'POST',
  });
}

export function updateProjectDocument(
  projectId: string,
  documentId: string,
  payload: { name?: string; parentId?: string | null },
): Promise<ProjectDocument> {
  return apiRequest<ProjectDocument>(`/projects/${projectId}/documents/${documentId}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  });
}

export function deleteProjectDocument(projectId: string, documentId: string): Promise<void> {
  return apiRequest<void>(`/projects/${projectId}/documents/${documentId}`, {
    method: 'DELETE',
  });
}

export interface FinanceAmounts {
  totalAmountCents: number;
  paidAmountCents: number;
  openAmountCents: number;
  costAmountCents: number;
  resultAmountCents: number;
  contractedResultAmountCents: number;
}

export interface FinanceContract {
  title: string;
  signedOn: string | null;
  startsOn: string | null;
  endsOn: string | null;
  totalAmountCents: number;
  installmentCount: number;
  status: 'draft' | 'active' | 'closed' | 'cancelled';
  hasFile: boolean;
  originalName: string | null;
}

export interface FinanceProject extends FinanceAmounts {
  tenantId: string;
  tenantName: string;
  projectId: string;
  projectName: string;
  workspaceId: string;
  workspaceName: string;
  contract: FinanceContract | null;
  installmentCount: number | null;
}

export interface FinanceList {
  projects: FinanceProject[];
  totals: FinanceAmounts;
}

export interface FinancePayment {
  id: string;
  paidOn: string;
  amountCents: number;
  note: string | null;
}

export interface FinanceCost {
  id: string;
  incurredOn: string;
  amountCents: number;
  category: 'team' | 'third_party' | 'infrastructure' | 'other';
  label: string;
  note: string | null;
}

export interface FinanceInstallment {
  position: number;
  amountCents: number;
  dueOn: string | null;
}

export interface ProjectFinance extends FinanceProject {
  payments: FinancePayment[];
  costs: FinanceCost[];
  installments: FinanceInstallment[];
}

export interface FinanceProjectDocument {
  id: string;
  projectId: string;
  originalName: string;
  contentType: string;
  byteSize: number;
  createdAt: string;
}

export function listFinanceProjects(): Promise<FinanceList> {
  return apiRequest<FinanceList>('/finance/projects');
}

export function listFinanceProjectDocuments(projectId: string): Promise<FinanceProjectDocument[]> {
  return apiRequest<FinanceProjectDocument[]>(`/finance/projects/${projectId}/documents`);
}

export function uploadFinanceProjectDocument(
  projectId: string,
  file: File,
): Promise<FinanceProjectDocument> {
  const body = new FormData();
  body.append('file', file);
  return apiRequest<FinanceProjectDocument>(`/finance/projects/${projectId}/documents`, {
    body,
    method: 'POST',
  });
}

export async function downloadFinanceProjectDocument(
  projectId: string,
  documentId: string,
  originalName: string,
): Promise<void> {
  const response = await fetch(
    `${apiBaseUrl}/api/v1/finance/projects/${projectId}/documents/${documentId}`,
    { credentials: 'include' },
  );

  if (!response.ok) {
    throw new ApiError(await getErrorMessage(response), response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = originalName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function getProjectFinance(projectId: string): Promise<ProjectFinance> {
  return apiRequest<ProjectFinance>(`/projects/${projectId}/finance`);
}

export function saveProjectContract(
  projectId: string,
  payload: {
    title: string;
    signedOn?: string;
    startsOn?: string;
    endsOn?: string;
    totalAmountCents: number;
    installmentCount: number;
    installments: { amountCents: number; dueOn: string | null }[];
    status: FinanceContract['status'];
  },
): Promise<FinanceContract & { installments: FinanceInstallment[] }> {
  return apiRequest<FinanceContract & { installments: FinanceInstallment[] }>(
    `/projects/${projectId}/contract`,
    {
      body: JSON.stringify(payload),
      method: 'PUT',
    },
  );
}

export function uploadContractFile(
  projectId: string,
  file: File,
): Promise<{ hasFile: boolean; originalName: string }> {
  const body = new FormData();
  body.append('file', file);
  return apiRequest<{ hasFile: boolean; originalName: string }>(
    `/projects/${projectId}/contract/file`,
    { body, method: 'POST' },
  );
}

export function deleteFinanceProject(projectId: string): Promise<void> {
  return apiRequest<void>(`/finance/projects/${projectId}`, { method: 'DELETE' });
}

export function deleteContractFile(projectId: string): Promise<void> {
  return apiRequest<void>(`/projects/${projectId}/contract/file`, { method: 'DELETE' });
}

export async function downloadContractFile(projectId: string, originalName: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/contract/file`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError(await getErrorMessage(response), response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = originalName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function createFinancePayment(
  projectId: string,
  payload: { paidOn: string; amountCents: number; note?: string },
): Promise<FinancePayment> {
  return apiRequest<FinancePayment>(`/projects/${projectId}/payments`, {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function updateFinancePayment(
  projectId: string,
  paymentId: string,
  payload: { paidOn: string; amountCents: number; note?: string },
): Promise<FinancePayment> {
  return apiRequest<FinancePayment>(`/projects/${projectId}/payments/${paymentId}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  });
}

export function deleteFinancePayment(projectId: string, paymentId: string): Promise<void> {
  return apiRequest<void>(`/projects/${projectId}/payments/${paymentId}`, { method: 'DELETE' });
}

export function createFinanceCost(
  projectId: string,
  payload: {
    incurredOn: string;
    amountCents: number;
    category: FinanceCost['category'];
    label?: string;
    note?: string;
  },
): Promise<FinanceCost> {
  return apiRequest<FinanceCost>(`/projects/${projectId}/costs`, {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function updateFinanceCost(
  projectId: string,
  costId: string,
  payload: {
    incurredOn: string;
    amountCents: number;
    category: FinanceCost['category'];
    label?: string;
    note?: string;
  },
): Promise<FinanceCost> {
  return apiRequest<FinanceCost>(`/projects/${projectId}/costs/${costId}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  });
}

export function deleteFinanceCost(projectId: string, costId: string): Promise<void> {
  return apiRequest<void>(`/projects/${projectId}/costs/${costId}`, { method: 'DELETE' });
}

export function replaceFinanceCostLines(
  projectId: string,
  payload: { lines: { label: string; amountCents: number }[] },
): Promise<FinanceCost[]> {
  return apiRequest<FinanceCost[]>(`/projects/${projectId}/cost-lines`, {
    body: JSON.stringify(payload),
    method: 'PUT',
  });
}

export interface TenantNote {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
}

export function listTenantNotes(tenantId: string): Promise<TenantNote[]> {
  return apiRequest<TenantNote[]>(`/finance/tenants/${tenantId}/notes`);
}

export function createTenantNote(
  tenantId: string,
  payload: { title: string; body: string },
): Promise<TenantNote> {
  return apiRequest<TenantNote>(`/finance/tenants/${tenantId}/notes`, {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function updateTenantNote(
  tenantId: string,
  noteId: string,
  payload: { title: string; body: string },
): Promise<TenantNote> {
  return apiRequest<TenantNote>(`/finance/tenants/${tenantId}/notes/${noteId}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  });
}

export function deleteTenantNote(tenantId: string, noteId: string): Promise<void> {
  return apiRequest<void>(`/finance/tenants/${tenantId}/notes/${noteId}`, { method: 'DELETE' });
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  contentType: string;
  byteSize: number;
  originalName: string;
  url: string;
  createdByUserId: string;
  createdByFirstName: string;
  createdByLastName: string;
}

export interface TicketSummary {
  id: string;
  tenantId: string;
  tenantName: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  hasNewComments: boolean;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  author: { id: string; displayName: string };
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetail extends TicketSummary {
  description: string;
  openedById: string;
  openedBy: { id: string; displayName: string };
  tenant: { id: string; displayName: string };
  comments: TicketComment[];
  attachments: TicketAttachment[];
}

export interface TicketList {
  items: TicketSummary[];
  page: number;
  limit: number;
  total: number;
}

export function listTickets(
  query: {
    category?: string;
    limit?: number;
    page?: number;
    status?: string;
    tenantId?: string;
  } = {},
): Promise<TicketList> {
  const params = new URLSearchParams();

  if (query.status) {
    params.set('status', query.status);
  }

  if (query.category) {
    params.set('category', query.category);
  }

  if (query.tenantId) {
    params.set('tenantId', query.tenantId);
  }

  if (query.page) {
    params.set('page', String(query.page));
  }

  if (query.limit) {
    params.set('limit', String(query.limit));
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return apiRequest<TicketList>(`/tickets${suffix}`);
}

export function getTicket(id: string): Promise<TicketDetail> {
  return apiRequest<TicketDetail>(`/tickets/${id}`);
}

export function createTicket(payload: {
  title: string;
  category: string;
  description: string;
  priority: string;
}): Promise<{ message: string; ticket: TicketDetail }> {
  return apiRequest<{ message: string; ticket: TicketDetail }>('/tickets', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function updateTicketStatus(
  id: string,
  status: string,
): Promise<{ message: string; ticket: TicketDetail }> {
  return apiRequest<{ message: string; ticket: TicketDetail }>(`/tickets/${id}`, {
    body: JSON.stringify({ status }),
    method: 'PATCH',
  });
}

export function createTicketComment(
  id: string,
  body: string,
): Promise<{ message: string; comment: TicketComment }> {
  return apiRequest<{ message: string; comment: TicketComment }>(`/tickets/${id}/comments`, {
    body: JSON.stringify({ body }),
    method: 'POST',
  });
}

export function addTicketAttachment(ticketId: string, file: File): Promise<TicketAttachment> {
  const body = new FormData();
  body.append('file', file);
  return apiRequest<TicketAttachment>(`/tickets/${ticketId}/attachments`, {
    body,
    method: 'POST',
  });
}

export function markTicketRead(id: string): Promise<void> {
  return apiRequest<void>(`/tickets/${id}/read`, {
    body: JSON.stringify({}),
    method: 'POST',
  });
}

export function cardAttachmentSrc(url: string): string {
  if (url.startsWith('/api/')) {
    return `${apiBaseUrl}${url}`;
  }

  return url;
}

export function projectBackgroundSrc(url: string): string {
  return cardAttachmentSrc(url);
}

export function projectDocumentSrc(url: string): string {
  return cardAttachmentSrc(url);
}

export function projectFolderArchiveSrc(projectId: string, documentId: string): string {
  return `${apiBaseUrl}/api/v1/projects/${projectId}/documents/${documentId}/archive`;
}

export interface ExpenseDocument {
  byteSize: number;
  contentType: string;
  createdAt: string;
  id: string;
  originalName: string;
}

export interface ExpenseItem {
  amountCents: number;
  categoryId: string;
  categoryName: string;
  clientTenantId: string | null;
  clientTenantName: string | null;
  competenceMonth: string;
  createdAt: string;
  description: string;
  dueOn: string | null;
  expenseType: string;
  id: string;
  paidOn: string | null;
  paymentMethod: string | null;
  projectId: string | null;
  projectName: string | null;
  recurrence: string | null;
  seriesDetached: boolean;
  seriesId: string | null;
  seriesIndex: number | null;
  status: string;
  subcategoryId: string | null;
  subcategoryName: string | null;
  supplierName: string | null;
  updatedAt: string;
}

export interface ExpenseDetail extends ExpenseItem {
  documents: ExpenseDocument[];
  notes: string | null;
}

export interface ExpenseList {
  items: ExpenseItem[];
  limit: number;
  page: number;
  summary: {
    count: number;
    paidTotalCents: number;
    pendingTotalCents: number;
    periodTotalCents: number;
  };
  total: number;
}

export interface ExpenseSeriesCreated {
  firstExpenseId: string;
  generatedCount: number;
  seriesId: string;
}

export interface ExpenseCategoryNode {
  active: boolean;
  expenseCount: number;
  id: string;
  name: string;
  position: number;
  slug: string;
  subcategories: ExpenseSubcategoryNode[];
}

export interface ExpenseSubcategoryNode {
  active: boolean;
  expenseCount: number;
  id: string;
  name: string;
  position: number;
  slug: string;
}

export interface ExpenseAssociations {
  projects: Array<{ id: string; name: string; tenantId: string; tenantName: string }>;
  tenants: Array<{ id: string; name: string }>;
}

export interface ExpenseWriteBody {
  amountCents?: number;
  categoryId?: string;
  clientTenantId?: string | null;
  competenceMonth?: string;
  count?: number;
  description?: string;
  dueOn?: string | null;
  expenseType?: string;
  notes?: string | null;
  paidOn?: string | null;
  paymentMethod?: string | null;
  projectId?: string | null;
  recurrence?: { count: number; interval: string; startsOn: string };
  scope?: 'occurrence' | 'series';
  startsOn?: string;
  status?: string;
  subcategoryId?: string | null;
  supplierName?: string | null;
}

export function listExpenses(query: string): Promise<ExpenseList> {
  return apiRequest<ExpenseList>(`/expenses?${query}`);
}

export function getExpense(id: string): Promise<ExpenseDetail> {
  return apiRequest<ExpenseDetail>(`/expenses/${id}`);
}

export function createExpense(body: ExpenseWriteBody): Promise<ExpenseDetail | ExpenseSeriesCreated> {
  return apiRequest<ExpenseDetail | ExpenseSeriesCreated>('/expenses', {
    body: JSON.stringify(body),
    method: 'POST',
  });
}

export function updateExpense(id: string, body: ExpenseWriteBody): Promise<ExpenseDetail> {
  return apiRequest<ExpenseDetail>(`/expenses/${id}`, {
    body: JSON.stringify(body),
    method: 'PATCH',
  });
}

export function cancelExpense(id: string): Promise<ExpenseDetail> {
  return apiRequest<ExpenseDetail>(`/expenses/${id}/cancel`, { method: 'POST' });
}

export function cancelExpenses(ids: string[]): Promise<{ alreadyCancelledIds: string[]; cancelledIds: string[] }> {
  return apiRequest('/expenses/cancel', {
    body: JSON.stringify({ ids }),
    method: 'POST',
  });
}

export function cancelExpenseSeries(id: string): Promise<{ cancelledCount: number }> {
  return apiRequest(`/expense-series/${id}/cancel`, { method: 'POST' });
}

export function listExpenseAssociations(): Promise<ExpenseAssociations> {
  return apiRequest<ExpenseAssociations>('/expenses/associations');
}

export function listExpenseCategories(): Promise<ExpenseCategoryNode[]> {
  return apiRequest<ExpenseCategoryNode[]>('/expense-categories');
}

export function createExpenseCategory(name: string): Promise<ExpenseCategoryNode> {
  return apiRequest<ExpenseCategoryNode>('/expense-categories', {
    body: JSON.stringify({ name }),
    method: 'POST',
  });
}

export function updateExpenseCategory(
  id: string,
  body: { active?: boolean; name?: string },
): Promise<ExpenseCategoryNode> {
  return apiRequest<ExpenseCategoryNode>(`/expense-categories/${id}`, {
    body: JSON.stringify(body),
    method: 'PATCH',
  });
}

export function deleteExpenseCategory(id: string): Promise<void> {
  return apiRequest<void>(`/expense-categories/${id}`, { method: 'DELETE' });
}

export function createExpenseSubcategory(categoryId: string, name: string): Promise<ExpenseSubcategoryNode> {
  return apiRequest<ExpenseSubcategoryNode>(`/expense-categories/${categoryId}/subcategories`, {
    body: JSON.stringify({ name }),
    method: 'POST',
  });
}

export function updateExpenseSubcategory(
  id: string,
  body: { active?: boolean; name?: string },
): Promise<ExpenseSubcategoryNode> {
  return apiRequest<ExpenseSubcategoryNode>(`/expense-subcategories/${id}`, {
    body: JSON.stringify(body),
    method: 'PATCH',
  });
}

export function deleteExpenseSubcategory(id: string): Promise<void> {
  return apiRequest<void>(`/expense-subcategories/${id}`, { method: 'DELETE' });
}

export function uploadExpenseDocument(expenseId: string, file: File): Promise<ExpenseDocument> {
  const body = new FormData();
  body.append('file', file);
  return apiRequest<ExpenseDocument>(`/expenses/${expenseId}/documents`, { body, method: 'POST' });
}

export async function downloadExpenseDocument(
  expenseId: string,
  documentId: string,
  originalName: string,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/v1/expenses/${expenseId}/documents/${documentId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError(await getErrorMessage(response), response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = originalName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function deleteExpenseDocument(expenseId: string, documentId: string): Promise<void> {
  return apiRequest<void>(`/expenses/${expenseId}/documents/${documentId}`, { method: 'DELETE' });
}
