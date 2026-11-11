export const contactExample = {
  customerEmail: 'ana@example.com',
  customerName: 'Ana Silva',
  projectDescription: 'Need a custom operations platform.',
};

export const loginExample = {
  email: 'user@example.com',
  password: 'ExamplePassword12!',
};

export const passwordRecoveryRequestExample = {
  email: 'user@example.com',
};

export const passwordRecoveryTokenExample =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

export const passwordRecoveryVerifyExample = {
  email: 'user@example.com',
  token: passwordRecoveryTokenExample,
};

export const passwordRecoveryResetExample = {
  email: 'user@example.com',
  password: 'ExamplePassword12!',
  passwordConfirmation: 'ExamplePassword12!',
  token: passwordRecoveryTokenExample,
};

export const safeUserExample = {
  age: 40,
  cargo: 'Product Manager',
  email: 'user@example.com',
  enabledActions: ['painel'],
  firstName: 'Ana',
  id: '11111111-1111-4111-8111-111111111111',
  lastName: 'Silva',
  photoUrl: '/api/v1/users/11111111-1111-4111-8111-111111111111/photo',
  profile: 'Administrador',
  sex: 'F',
  tenantId: '22222222-2222-4222-8222-222222222222',
  tenantName: 'Acme',
  tenantPhotoUrl: '/api/v1/tenants/22222222-2222-4222-8222-222222222222/photo',
  tenantSlug: 'acme',
};

export const tenantListItemExample = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Acme',
  slug: 'acme',
};

export const createTenantExample = {
  email: 'ops@example.com',
  name: 'Northwind',
  slug: 'northwind',
};

export const tenantCreatedExample = {
  email: 'ops@example.com',
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Northwind',
  slug: 'northwind',
};

export const createUserExample = {
  age: 32,
  cargo: 'Product Manager',
  email: 'nova@example.com',
  enabledActions: ['painel', 'createUser'],
  firstName: 'Nova',
  lastName: 'User',
  password: 'ExamplePassword12!',
  sex: 'F',
  tenantId: '22222222-2222-4222-8222-222222222222',
};

export const userListItemExample = {
  cargo: 'Product Manager',
  email: 'nova@example.com',
  enabledActions: ['viewProjects'],
  firstName: 'Nova',
  id: '11111111-1111-4111-8111-111111111111',
  lastName: 'User',
  profile: 'Usuario',
  status: 'active',
  tenantId: '22222222-2222-4222-8222-222222222222',
  tenantName: 'Acme',
  tenantSlug: 'acme',
};

export const healthExample = {
  checks: {
    api: { status: 'up' },
    database: { status: 'up' },
    smtp: { status: 'up' },
  },
  status: 'healthy',
};

export const passwordRecoveryAcceptedExample = {
  message: 'Se a conta existir, enviaremos instruções por e-mail.',
};

export const passwordRecoveryVerifyResponseExample = {
  valid: true,
};

export const powerBiWorkspaceExample = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Finance workspace',
};

export const powerBiPythonReportExample = {
  datasetId: '55555555-5555-4555-8555-555555555555',
  embedUrl:
    'https://app.powerbi.com/reportEmbed?reportId=44444444-4444-4444-8444-444444444444',
  id: '44444444-4444-4444-8444-444444444444',
  name: 'Revenue overview',
};

export const powerBiPageExample = {
  displayName: 'Summary',
  name: 'ReportSection',
  order: 0,
};

export const powerBiCatalogReportExample = {
  ativo: true,
  datasetId: powerBiPythonReportExample.datasetId,
  descricao: 'Monthly revenue overview',
  embedUrl: powerBiPythonReportExample.embedUrl,
  id: '66666666-6666-4666-8666-666666666666',
  nome: 'Revenue overview',
  reportId: powerBiPythonReportExample.id,
  workspaceId: powerBiWorkspaceExample.id,
};

export const createPowerBiReportExample = {
  descricao: 'Monthly revenue overview',
  nome: 'Revenue overview',
  reportId: powerBiPythonReportExample.id,
  workspaceId: powerBiWorkspaceExample.id,
};

export const updatePowerBiReportExample = {
  descricao: 'Updated description',
  nome: 'Revenue overview',
};

export const powerBiStatusExample = {
  ativo: false,
};

export const powerBiDistributionExample = {
  ativo: true,
  icone: 'chart',
  id: '77777777-7777-4777-8777-777777777777',
  nomeExibicao: 'Revenue',
  ordem: 1,
  paginaPadrao: 'ReportSection',
  relatorioId: powerBiCatalogReportExample.id,
  tenantId: '22222222-2222-4222-8222-222222222222',
  tenantName: 'Acme',
  tenantSlug: 'acme',
};

export const createPowerBiDistributionExample = {
  icone: 'chart',
  nomeExibicao: 'Revenue',
  ordem: 1,
  paginaPadrao: 'ReportSection',
  tenantId: '22222222-2222-4222-8222-222222222222',
};

export const updatePowerBiDistributionExample = {
  icone: 'chart',
  nomeExibicao: 'Revenue',
  ordem: 2,
  paginaPadrao: 'ReportSection',
};

export const powerBiMyReportExample = {
  icone: 'chart',
  id: powerBiDistributionExample.id,
  nomeExibicao: 'Revenue',
  ordem: 1,
  paginaPadrao: 'ReportSection',
  relatorio: {
    descricao: powerBiCatalogReportExample.descricao,
    id: powerBiCatalogReportExample.id,
    nome: powerBiCatalogReportExample.nome,
  },
  tenantId: powerBiDistributionExample.tenantId,
};

export const powerBiEmbedTokenExample = {
  embedToken: 'embed-token-example',
  embedUrl: powerBiPythonReportExample.embedUrl,
  expiration: '2026-09-20T23:00:00.000Z',
  id: powerBiDistributionExample.id,
  nome: 'Revenue',
  paginaPadrao: 'ReportSection',
};

export const updateSessionTenantExample = {
  tenantId: '22222222-2222-4222-8222-222222222222',
};

export const projectWorkspaceExample = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Delivery',
  tenantId: '22222222-2222-4222-8222-222222222222',
};

export const projectSummaryExample = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  name: 'Portal Kanban',
  workspaceId: projectWorkspaceExample.id,
};

export const kanbanFiltersExample = {
  date: {
    endDate: '2026-09-30',
    mode: 'range' as const,
    startDate: '2026-09-01',
  },
  status: ['backlog', 'working'],
  taskCompletion: 'incomplete' as const,
};

export const cardCommentExample = {
  authorFirstName: 'Ana',
  authorLastName: 'Silva',
  authorUserId: '11111111-1111-4111-8111-111111111111',
  body: 'Ready for review.',
  cardId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  createdAt: '2026-09-21T12:00:00.000Z',
  id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  updatedAt: '2026-09-21T12:00:00.000Z',
};

export const cardAttachmentExample = {
  byteSize: 1024,
  cardId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  contentType: 'application/pdf',
  createdByFirstName: 'Ana',
  createdByLastName: 'Silva',
  createdByUserId: '11111111-1111-4111-8111-111111111111',
  id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  originalName: 'brief.pdf',
  url: '/api/v1/cards/cccccccc-cccc-4ccc-8ccc-cccccccccccc/attachments/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
};

export const cardChecklistItemExample = {
  body: 'Write the specification',
  cardId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  createdByUserId: '11111111-1111-4111-8111-111111111111',
  done: false,
  id: 'abababab-abab-4abc-8abc-abababababab',
  position: 0,
};

export const cardExample = {
  assigneeFirstName: 'Ana',
  assigneeLastName: 'Silva',
  assigneePhotoUrl: '/api/v1/users/11111111-1111-4111-8111-111111111111/photo',
  assigneeUserId: '11111111-1111-4111-8111-111111111111',
  attachments: [cardAttachmentExample],
  checklistItems: [cardChecklistItemExample],
  comments: [cardCommentExample],
  coverAttachmentId: cardAttachmentExample.id,
  createdAt: '2026-09-21T12:00:00.000Z',
  createdByFirstName: 'Ana',
  createdByLastName: 'Silva',
  createdByUserId: '11111111-1111-4111-8111-111111111111',
  description: 'Implement the authenticated Kanban board.',
  dueAt: '2026-09-30T03:00:00.000Z',
  startsAt: '2026-09-21T03:00:00.000Z',
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  lane: 'backlog',
  number: 1,
  position: 0,
  priority: 'medium',
  projectId: projectSummaryExample.id,
  tags: [{ color: 'lime', name: 'portal' }],
  title: 'Build the board',
};

export const projectBoardExample = {
  backgroundUrl: null,
  documents: [],
  id: projectSummaryExample.id,
  kanbanFilters: kanbanFiltersExample,
  lanes: [
    {
      cards: [cardExample],
      color: '#64748B',
      key: 'backlog',
      label: 'Backlog',
    },
    { cards: [], color: '#3D9CF0', key: 'ready', label: 'Pronto' },
    { cards: [], color: '#F5A524', key: 'working', label: 'Trabalhando' },
    { cards: [], color: '#7B6CFF', key: 'review', label: 'Revisão' },
    { cards: [], color: '#2EC4B6', key: 'deploy', label: 'Deploy' },
    { cards: [], color: '#BDDA2B', key: 'done', label: 'Finalizado' },
  ],
  name: projectSummaryExample.name,
  tenantId: projectWorkspaceExample.tenantId,
  workspaceId: projectWorkspaceExample.id,
};

export const createCardExample = {
  assigneeUserId: cardExample.assigneeUserId,
  description: cardExample.description,
  dueAt: cardExample.dueAt,
  startsAt: cardExample.startsAt,
  priority: 'medium',
  tags: [{ color: 'lime', name: 'portal' }],
  title: cardExample.title,
};

export const moveCardExample = {
  lane: 'ready',
};

export const placeCardExample = {
  lane: 'ready',
  position: 0,
};

export const reorderCardExample = {
  direction: 'up',
};

export const cardCommentBodyExample = {
  body: 'Ready for review.',
};
