import { afterEach, describe, expect, it } from 'vitest';
import {
  PORTAL_THEME_KEY,
  readPortalTheme,
  setPortalTheme,
  togglePortalTheme,
} from './portal-theme';

describe('portal theme', () => {
  afterEach(() => {
    localStorage.removeItem(PORTAL_THEME_KEY);
  });

  it('defaults to light when nothing is stored', () => {
    expect(readPortalTheme()).toBe('light');
  });

  it('persists a toggle between dark and light', () => {
    setPortalTheme('dark');
    expect(localStorage.getItem(PORTAL_THEME_KEY)).toBe('dark');
    expect(readPortalTheme()).toBe('dark');

    togglePortalTheme();
    expect(readPortalTheme()).toBe('light');
  });
});
