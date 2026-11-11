import { afterEach, describe, expect, it } from 'vitest';
import {
  clearPortalCadastroIntent,
  PORTAL_CADASTRO_INTENT_KEY,
  rememberPortalCadastroIntent,
  takePortalCadastroIntent,
} from './portal-cadastro';

describe('portal cadastro intent', () => {
  afterEach(() => {
    sessionStorage.removeItem(PORTAL_CADASTRO_INTENT_KEY);
  });

  it('remembers and consumes a pending Cadastro open', () => {
    expect(takePortalCadastroIntent()).toBe(false);
    rememberPortalCadastroIntent();
    expect(sessionStorage.getItem(PORTAL_CADASTRO_INTENT_KEY)).toBe('1');
    expect(takePortalCadastroIntent()).toBe(true);
    expect(takePortalCadastroIntent()).toBe(false);
  });

  it('clears a pending Cadastro open', () => {
    rememberPortalCadastroIntent();
    clearPortalCadastroIntent();
    expect(takePortalCadastroIntent()).toBe(false);
  });
});
