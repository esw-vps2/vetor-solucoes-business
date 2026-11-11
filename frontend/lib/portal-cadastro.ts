export const PORTAL_CADASTRO_INTENT_KEY = 'portalCadastro:v1';

export function rememberPortalCadastroIntent(): void {
  try {
    sessionStorage.setItem(PORTAL_CADASTRO_INTENT_KEY, '1');
  } catch {
    return;
  }
}

export function takePortalCadastroIntent(): boolean {
  try {
    if (sessionStorage.getItem(PORTAL_CADASTRO_INTENT_KEY) !== '1') {
      return false;
    }

    sessionStorage.removeItem(PORTAL_CADASTRO_INTENT_KEY);
    return true;
  } catch {
    return false;
  }
}

export function clearPortalCadastroIntent(): void {
  try {
    sessionStorage.removeItem(PORTAL_CADASTRO_INTENT_KEY);
  } catch {
    return;
  }
}
