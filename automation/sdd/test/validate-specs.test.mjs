import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateSpecification, validateSpecifications } from '../validate-specs.mjs';

function createSpecification(status, overrides = {}) {
  const values = {
    id: 'BASE-001',
    title: 'Create example capability',
    status,
    sourceKind: 'human_prompt',
    sourceReference: 'chat-2026-09-09-example-capability',
    context: 'Users need a clear starting point.',
    desiredOutcome: 'Users can start the capability.',
    inScope: '- Provide the documented capability.',
    outOfScope: '- Do not add unrelated integrations.',
    acceptanceCriteria: '- AC-001: A user can observe the documented outcome.',
    userExperience: 'Use the approved visual system.',
    api: 'No API changes.',
    data: 'No data changes.',
    security: 'No new sensitive data is processed.',
    testing: '- AC-001: frontend/app/example.spec.tsx',
    delivery: 'Deploy through the existing release process.',
    traceability: 'Source: chat-2026-09-09-example-capability.',
    implementationEvidence: 'Not implemented.',
    validationEvidence: 'Not validated.',
    ...overrides,
  };

  return `---
id: ${values.id}
title: ${values.title}
status: ${values.status}
source_kind: ${values.sourceKind}
source_reference: ${values.sourceReference}
created_at: 2026-09-09
updated_at: 2026-09-09
---

# ${values.title}

## Context

${values.context}

## Desired outcome

${values.desiredOutcome}

## In scope

${values.inScope}

## Out of scope

${values.outOfScope}

## Acceptance criteria

${values.acceptanceCriteria}

## User experience

${values.userExperience}

## API and integrations

${values.api}

## Data impact

${values.data}

## Security

${values.security}

## Testing

${values.testing}

## Delivery

${values.delivery}

## Traceability

${values.traceability}

## Implementation evidence

${values.implementationEvidence}

## Validation evidence

${values.validationEvidence}
`;
}

test('accepts an approved specification with mapped acceptance criteria', () => {
  const issues = validateSpecification(createSpecification('approved'), 'base-001.md');

  assert.deepEqual(issues, []);
});

test('accepts implementation evidence for an implemented specification', () => {
  const issues = validateSpecification(
    createSpecification('implemented', {
      implementationEvidence:
        '- Changed: `frontend/app/example.tsx`\n- Tests: `npm run test --workspace frontend`',
    }),
    'base-001.md',
  );

  assert.deepEqual(issues, []);
});

test('requires implementation evidence when work is marked implemented', () => {
  const issues = validateSpecification(createSpecification('implemented'), 'base-001.md');

  assert.ok(issues.some((issue) => issue.includes('"Changed" implementation evidence')));
  assert.ok(issues.some((issue) => issue.includes('"Tests" implementation evidence')));
});

test('requires passed evidence for every validated acceptance criterion', () => {
  const issues = validateSpecification(
    createSpecification('validated', {
      implementationEvidence:
        '- Changed: `frontend/app/example.tsx`\n- Tests: `npm run test --workspace frontend`',
      validationEvidence: '- AC-001: passed',
    }),
    'base-001.md',
  );

  assert.deepEqual(issues, []);
});

test('accepts a draft specification with unresolved placeholders', () => {
  const issues = validateSpecification(
    createSpecification('draft', {
      sourceReference: 'TBD',
      context: 'TBD',
      desiredOutcome: 'TBD',
      acceptanceCriteria: '- AC-001: TBD',
      testing: 'TBD',
    }),
    'base-001.md',
  );

  assert.deepEqual(issues, []);
});

test('rejects an approved specification with unresolved work', () => {
  const issues = validateSpecification(
    createSpecification('approved', {
      acceptanceCriteria: '- AC-001: TBD',
      testing: 'TBD',
    }),
    'base-001.md',
  );

  assert.ok(issues.some((issue) => issue.includes('cannot contain "TBD"')));
});

test('rejects an unknown lifecycle status', () => {
  const issues = validateSpecification(createSpecification('ready'), 'base-001.md');

  assert.ok(issues.some((issue) => issue.includes('unsupported status "ready"')));
});

test('rejects a specification that is not from a human prompt', () => {
  const issues = validateSpecification(
    createSpecification('draft', { sourceKind: 'github_issue' }),
    'base-001.md',
  );

  assert.ok(issues.some((issue) => issue.includes('unsupported "source_kind"')));
});

test('rejects a source_reference that is not a chat identifier', () => {
  const issues = validateSpecification(
    createSpecification('draft', {
      sourceReference: 'https://github.com/org/repo/issues/12',
    }),
    'base-001.md',
  );

  assert.ok(issues.some((issue) => issue.includes('invalid "source_reference"')));
});

test('ignores specification templates when validating a directory', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sdd-specs-'));

  try {
    await writeFile(join(directory, '_template.md'), createSpecification('draft'));
    await writeFile(join(directory, 'base-001.md'), createSpecification('approved'));

    const result = await validateSpecifications(directory);

    assert.deepEqual(result.specificationFiles, ['base-001.md']);
    assert.deepEqual(result.issues, []);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
