export const POWER_BI_DEFAULT_PAGE_SIZE = { height: 720, width: 1280 };

export function embedRenewDelayMs(expiration: string, now = Date.now()): number {
  const expiresAt = Date.parse(expiration);
  if (Number.isNaN(expiresAt)) {
    return 30_000;
  }

  return Math.max(expiresAt - now - 2 * 60 * 1000, 30_000);
}

export function reportIdFromEmbedUrl(embedUrl: string): string | undefined {
  try {
    return new URL(embedUrl).searchParams.get('reportId') ?? undefined;
  } catch {
    return undefined;
  }
}

export function resolvePowerBiPageSize(size?: {
  height?: number;
  width?: number;
}): { height: number; width: number } {
  if (
    typeof size?.width === 'number' &&
    size.width > 0 &&
    typeof size.height === 'number' &&
    size.height > 0
  ) {
    return { height: size.height, width: size.width };
  }

  return POWER_BI_DEFAULT_PAGE_SIZE;
}

export function powerBiPageFillStyle(
  containerWidth: number,
  containerHeight: number,
  pageWidth: number,
  pageHeight: number,
): { height: string; transform: string; transformOrigin: string; width: string } {
  if (containerWidth <= 0 || pageWidth <= 0 || pageHeight <= 0) {
    return {
      height: '100%',
      transform: 'none',
      transformOrigin: 'top left',
      width: '100%',
    };
  }

  const scale = containerWidth / pageWidth;
  const height = Math.max(pageHeight * scale, containerHeight);

  return {
    height: `${height}px`,
    transform: 'none',
    transformOrigin: 'top left',
    width: '100%',
  };
}

export function applyPowerBiPageFill(
  container: HTMLElement,
  pageWidth: number,
  pageHeight: number,
): void {
  const iframe = container.querySelector('iframe');
  if (!(iframe instanceof HTMLIFrameElement)) {
    return;
  }

  const style = powerBiPageFillStyle(
    container.clientWidth,
    container.clientHeight,
    pageWidth,
    pageHeight,
  );
  iframe.style.height = style.height;
  iframe.style.transform = style.transform;
  iframe.style.transformOrigin = style.transformOrigin;
  iframe.style.width = style.width;
}
