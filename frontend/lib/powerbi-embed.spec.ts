import { describe, expect, it } from 'vitest';
import {
  applyPowerBiPageFill,
  embedRenewDelayMs,
  powerBiPageFillStyle,
  reportIdFromEmbedUrl,
  resolvePowerBiPageSize,
} from './powerbi-embed';

describe('powerbi embed helpers', () => {
  it('renews two minutes before expiry with a 30 second minimum', () => {
    const now = Date.parse('2026-09-20T12:00:00.000Z');
    expect(embedRenewDelayMs('2026-09-20T13:00:00.000Z', now)).toBe(58 * 60 * 1000);
    expect(embedRenewDelayMs('2026-09-20T12:01:00.000Z', now)).toBe(30_000);
    expect(embedRenewDelayMs('not-a-date', now)).toBe(30_000);
  });

  it('reads the Power BI report id from the embed URL', () => {
    expect(
      reportIdFromEmbedUrl(
        'https://app.powerbi.com/reportEmbed?reportId=44444444-4444-4444-8444-444444444444',
      ),
    ).toBe('44444444-4444-4444-8444-444444444444');
  });

  it('uses saved page size when present and 16:9 otherwise', () => {
    expect(resolvePowerBiPageSize({ height: 900, width: 1600 })).toEqual({
      height: 900,
      width: 1600,
    });
    expect(resolvePowerBiPageSize()).toEqual({
      height: 720,
      width: 1280,
    });
  });

  it('fills the container width and grows with the native page height', () => {
    expect(powerBiPageFillStyle(1280, 720, 1280, 720)).toEqual({
      height: '720px',
      transform: 'none',
      transformOrigin: 'top left',
      width: '100%',
    });

    const tallPage = powerBiPageFillStyle(1398, 794, 1280, 1497);
    expect(tallPage.width).toBe('100%');
    expect(tallPage.height).toBe(`${1497 * (1398 / 1280)}px`);
    expect(tallPage.transform).toBe('none');

    const widePage = powerBiPageFillStyle(951, 738, 1280, 720);
    expect(widePage.width).toBe('100%');
    expect(widePage.height).toBe('738px');
  });

  it('writes fill styles onto the embed iframe', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 1000 });
    Object.defineProperty(container, 'clientHeight', { value: 500 });
    const iframe = document.createElement('iframe');
    container.appendChild(iframe);

    applyPowerBiPageFill(container, 1280, 720);

    expect(iframe.style.width).toBe('100%');
    expect(iframe.style.height).toBe('562.5px');
    expect(iframe.style.transform).toBe('none');
  });
});
