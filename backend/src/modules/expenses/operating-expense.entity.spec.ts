import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getMetadataArgsStorage } from 'typeorm';
import { OperatingExpense } from './entities/operating-expense.entity.js';

describe('operating expense persistence', () => {
  it('keeps the company expense when a project or tenant is deleted', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      (relation) => relation.target === OperatingExpense,
    );
    expect(relations.find((relation) => relation.propertyName === 'project')?.options.onDelete).toBe(
      'SET NULL',
    );
    expect(
      relations.find((relation) => relation.propertyName === 'clientTenant')?.options.onDelete,
    ).toBe('SET NULL');
  });

  it('seeds the five category names once', () => {
    const sql = readFileSync(
      new URL('../../database/migrations/1760000021000-add-operating-expenses.ts', import.meta.url),
      'utf8',
    );
    expect(sql).toContain('Infraestrutura e Cloud');
    expect(sql).toContain('IA e APIs');
    expect(sql).toContain('Marketing e aquisição');
    expect(sql).toContain('Software e licenças');
    expect(sql).toContain('Serviços e operação');
    expect(sql).toContain('ON CONFLICT ("slug") DO NOTHING');
    expect(sql).toContain('ON DELETE SET NULL');
  });
});
