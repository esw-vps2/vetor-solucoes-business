import { BadRequestException } from '@nestjs/common';
import {
  assertMappedActions,
  enabledActionsForActor,
  hasMappedAction,
  parseEnabledActions,
} from './enabled-actions.js';

describe('enabled actions', () => {
  it('parses JSON, repeated values, and empty input', () => {
    expect(parseEnabledActions(undefined)).toEqual([]);
    expect(parseEnabledActions('[]')).toEqual([]);
    expect(parseEnabledActions('["painel","createUser"]')).toEqual([
      'painel',
      'createUser',
    ]);
    expect(parseEnabledActions(['editUser', 'editUser'])).toEqual(['editUser']);
  });

  it('rejects values outside the mapped set', () => {
    expect(() => parseEnabledActions(['powerbi'])).toThrow(BadRequestException);
    expect(() => assertMappedActions(['painel', 'unknown'])).toThrow(
      BadRequestException,
    );
  });

  it('grants every mapped action to Administrador and extras to Usuario', () => {
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'Administrador' },
        'createUser',
      ),
    ).toBe(true);
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'Administrador' },
        'viewProjects',
      ),
    ).toBe(true);
    expect(
      hasMappedAction({ enabledActions: [], profile: 'Usuario' }, 'createUser'),
    ).toBe(false);
    expect(
      hasMappedAction(
        { enabledActions: ['createUser'], profile: 'Usuario' },
        'createUser',
      ),
    ).toBe(true);
  });

  it('grants implied mapped actions to AdministradorTenant', () => {
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'AdministradorTenant' },
        'viewProjects',
      ),
    ).toBe(true);
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'AdministradorTenant' },
        'moveCards',
      ),
    ).toBe(true);
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'AdministradorTenant' },
        'createUser',
      ),
    ).toBe(true);
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'AdministradorTenant' },
        'manageProjects',
      ),
    ).toBe(true);
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'AdministradorTenant' },
        'editUser',
      ),
    ).toBe(true);
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'AdministradorTenant' },
        'painel',
      ),
    ).toBe(true);
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'AdministradorTenant' },
        'viewReports',
      ),
    ).toBe(true);
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'AdministradorTenant' },
        'createTenant',
      ),
    ).toBe(false);
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'AdministradorTenant' },
        'createLane',
      ),
    ).toBe(false);
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'Administrador' },
        'deleteLane',
      ),
    ).toBe(true);
    expect(
      hasMappedAction(
        { enabledActions: ['renameLane'], profile: 'Usuario' },
        'renameLane',
      ),
    ).toBe(true);
  });

  it('grants createTenant to Administrador and stored Usuario grants', () => {
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'Administrador' },
        'createTenant',
      ),
    ).toBe(true);
    expect(
      hasMappedAction(
        { enabledActions: ['createTenant'], profile: 'Usuario' },
        'createTenant',
      ),
    ).toBe(true);
    expect(
      hasMappedAction(
        { enabledActions: ['createTenant'], profile: 'AdministradorTenant' },
        'createTenant',
      ),
    ).toBe(true);
    expect(parseEnabledActions(['createTenant'])).toEqual(['createTenant']);
  });

  it('keeps an explicit AdministradorTenant selection and legacy extras', () => {
    expect(
      hasMappedAction(
        {
          enabledActions: ['createUser', 'createLane'],
          profile: 'AdministradorTenant',
        },
        'painel',
      ),
    ).toBe(false);
    expect(
      hasMappedAction(
        {
          enabledActions: ['createUser', 'createLane'],
          profile: 'AdministradorTenant',
        },
        'createLane',
      ),
    ).toBe(true);
    expect(
      hasMappedAction(
        { enabledActions: ['createLane'], profile: 'AdministradorTenant' },
        'moveCards',
      ),
    ).toBe(true);
  });

  it('accepts vetorAgent without implying it for AdministradorTenant', () => {
    expect(parseEnabledActions(['vetorAgent'])).toEqual(['vetorAgent']);
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'Administrador' },
        'vetorAgent',
      ),
    ).toBe(true);
    expect(
      hasMappedAction({ enabledActions: [], profile: 'Usuario' }, 'vetorAgent'),
    ).toBe(false);
    expect(
      hasMappedAction(
        { enabledActions: ['vetorAgent'], profile: 'Usuario' },
        'vetorAgent',
      ),
    ).toBe(true);
    expect(
      hasMappedAction(
        { enabledActions: [], profile: 'AdministradorTenant' },
        'vetorAgent',
      ),
    ).toBe(false);
    expect(
      hasMappedAction(
        { enabledActions: ['painel'], profile: 'AdministradorTenant' },
        'vetorAgent',
      ),
    ).toBe(false);
    expect(
      hasMappedAction(
        { enabledActions: ['vetorAgent'], profile: 'AdministradorTenant' },
        'vetorAgent',
      ),
    ).toBe(true);
    expect(
      enabledActionsForActor(
        { profile: 'AdministradorTenant' },
        [],
        ['vetorAgent', 'painel'],
      ),
    ).toEqual(['vetorAgent', 'painel']);
    expect(
      enabledActionsForActor({ profile: 'Administrador' }, [], ['vetorAgent']),
    ).toEqual(['vetorAgent']);
  });

  it('lets only Administrador grant lane configuration', () => {
    expect(
      enabledActionsForActor(
        { profile: 'Administrador' },
        [],
        ['createLane', 'painel'],
      ),
    ).toEqual(['createLane', 'painel']);
    expect(
      enabledActionsForActor(
        { profile: 'AdministradorTenant' },
        ['renameLane'],
        ['createLane', 'painel'],
      ),
    ).toEqual(['painel', 'renameLane']);
  });
});
