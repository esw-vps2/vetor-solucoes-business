export const PORTAL_THEME_KEY = 'portalTheme:v1';

export type PortalTheme = 'light' | 'dark';

const listeners = new Set<() => void>();

function isPortalTheme(value: string | null): value is PortalTheme {
  return value === 'light' || value === 'dark';
}

export function readPortalTheme(): PortalTheme {
  try {
    const stored = localStorage.getItem(PORTAL_THEME_KEY);
    return isPortalTheme(stored) ? stored : 'light';
  } catch {
    return 'light';
  }
}

export function writePortalTheme(theme: PortalTheme): void {
  try {
    localStorage.setItem(PORTAL_THEME_KEY, theme);
  } catch {
    return;
  }
}

export function subscribePortalTheme(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getPortalThemeSnapshot(): PortalTheme {
  return readPortalTheme();
}

export function getPortalThemeServerSnapshot(): PortalTheme {
  return 'light';
}

export function setPortalTheme(theme: PortalTheme): void {
  writePortalTheme(theme);
  listeners.forEach((listener) => listener());
}

export function togglePortalTheme(): void {
  setPortalTheme(readPortalTheme() === 'dark' ? 'light' : 'dark');
}
