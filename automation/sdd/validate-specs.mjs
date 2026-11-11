import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const allowedStatuses = new Set([
  'draft',
  'in_review',
  'approved',
  'implemented',
  'validated',
  'superseded',
]);

const requiredFrontmatterFields = [
  'id',
  'title',
  'status',
  'source_kind',
  'source_reference',
  'created_at',
  'updated_at',
];

const requiredSections = [
  'Context',
  'Desired outcome',
  'In scope',
  'Out of scope',
  'Acceptance criteria',
  'User experience',
  'API and integrations',
  'Data impact',
  'Security',
  'Testing',
  'Delivery',
  'Traceability',
  'Implementation evidence',
  'Validation evidence',
];

const deliveryReadyStatuses = new Set(['in_review', 'approved', 'implemented', 'validated']);

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (!match) {
    return { data: {}, body: content, errors: ['must start with YAML frontmatter'] };
  }

  const data = {};
  const errors = [];

  for (const line of match[1].split(/\r?\n/)) {
    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) {
      errors.push(`contains invalid frontmatter line "${line}"`);
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');

    if (!key || !value) {
      errors.push(`contains invalid frontmatter field "${line}"`);
      continue;
    }

    data[key] = value;
  }

  return { data, body: match[2], errors };
}

function getSectionContent(body, sectionName) {
  const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = body.match(
    new RegExp(`^## ${escapedName}\\s*$\\r?\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'),
  );

  return match?.[1].trim() ?? null;
}

function hasPlaceholder(value) {
  return /\bTBD\b/i.test(value);
}

function hasEvidenceEntry(section, label) {
  return new RegExp(`^- ${label}:\\s*(?!TBD\\b)\\S+`, 'im').test(section);
}

function validateDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function validateSpecification(content, fileName = 'specification') {
  const { data, body, errors } = parseFrontmatter(content);
  const issues = [...errors];

  for (const field of requiredFrontmatterFields) {
    if (!data[field]) {
      issues.push(`is missing frontmatter field "${field}"`);
    }
  }

  if (data.id && !/^[A-Z][A-Z0-9]*-\d+$/.test(data.id)) {
    issues.push('has an invalid "id"; use UPPERCASE-PREFIX-001');
  }

  if (data.status && !allowedStatuses.has(data.status)) {
    issues.push(`has unsupported status "${data.status}"`);
  }

  if (data.source_kind && data.source_kind !== 'human_prompt') {
    issues.push('has unsupported "source_kind"; use "human_prompt"');
  }

  if (
    data.source_reference &&
    data.source_reference !== 'TBD' &&
    !/^chat-\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9_-]*$/i.test(data.source_reference)
  ) {
    issues.push('has an invalid "source_reference"; use chat-YYYY-MM-DD-<slug>');
  }

  for (const field of ['created_at', 'updated_at']) {
    if (data[field] && !validateDate(data[field])) {
      issues.push(`has an invalid "${field}"; use YYYY-MM-DD`);
    }
  }

  if (
    data.title &&
    !new RegExp(`^# ${data.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').test(body)
  ) {
    issues.push('must contain an H1 matching the frontmatter "title"');
  }

  for (const sectionName of requiredSections) {
    if (getSectionContent(body, sectionName) === null) {
      issues.push(`is missing section "${sectionName}"`);
    }
  }

  if (!data.status || !deliveryReadyStatuses.has(data.status)) {
    return issues.map((issue) => `${fileName}: ${issue}`);
  }

  if (hasPlaceholder(content)) {
    issues.push(`cannot contain "TBD" when status is "${data.status}"`);
  }

  for (const sectionName of requiredSections.slice(0, -2)) {
    if (!getSectionContent(body, sectionName)) {
      issues.push(`requires non-empty section "${sectionName}"`);
    }
  }

  const acceptanceCriteria = getSectionContent(body, 'Acceptance criteria') ?? '';
  const acceptanceCriteriaIds = [...acceptanceCriteria.matchAll(/^- (AC-\d{3}): .+$/gm)].map(
    (match) => match[1],
  );

  if (acceptanceCriteriaIds.length === 0) {
    issues.push('requires at least one acceptance criterion in the form "AC-001: description"');
  }

  const testing = getSectionContent(body, 'Testing') ?? '';

  for (const criterionId of acceptanceCriteriaIds) {
    if (!new RegExp(`\\b${criterionId}:\\s*\\S+`).test(testing)) {
      issues.push(`requires a testing reference for "${criterionId}"`);
    }
  }

  if (data.status === 'implemented' || data.status === 'validated') {
    const implementationEvidence = getSectionContent(body, 'Implementation evidence') ?? '';

    if (!hasEvidenceEntry(implementationEvidence, 'Changed')) {
      issues.push('requires a "Changed" implementation evidence entry');
    }

    if (!hasEvidenceEntry(implementationEvidence, 'Tests')) {
      issues.push('requires a "Tests" implementation evidence entry');
    }
  }

  if (data.status === 'validated') {
    const validationEvidence = getSectionContent(body, 'Validation evidence') ?? '';

    for (const criterionId of acceptanceCriteriaIds) {
      if (!new RegExp(`^- ${criterionId}: passed\\b`, 'im').test(validationEvidence)) {
        issues.push(`requires passed validation evidence for "${criterionId}"`);
      }
    }
  }

  return issues.map((issue) => `${fileName}: ${issue}`);
}

export async function validateSpecifications(specificationsDirectory) {
  const entries = await readdir(specificationsDirectory, { withFileTypes: true });
  const specificationFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort();
  const issues = [];

  for (const fileName of specificationFiles) {
    const content = await readFile(join(specificationsDirectory, fileName), 'utf8');
    issues.push(...validateSpecification(content, fileName));
  }

  return { issues, specificationFiles };
}

async function run() {
  const scriptDirectory = fileURLToPath(new URL('.', import.meta.url));
  const specificationsDirectory = join(scriptDirectory, '../../docs/specs');
  const { issues, specificationFiles } = await validateSpecifications(specificationsDirectory);

  if (issues.length > 0) {
    console.error(issues.join('\n'));
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${specificationFiles.length} feature specification(s).`);
}

if (basename(process.argv[1] ?? '') === 'validate-specs.mjs') {
  await run();
}
