interface SurfaceGrainProps {
  tone: 'dark' | 'light';
}

function grainUrl(colorMatrix: string) {
  const svg = `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer><feColorMatrix type="matrix" values="${colorMatrix}"/></filter><rect width="100%" height="100%" filter="url(#g)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const LIGHT_SPECKS = grainUrl('0 0 0 0 0.941 0 0 0 0 0.949 0 0 0 0 0.969 0.33 0.33 0.34 0 0');

const DARK_SPECKS = grainUrl('0 0 0 0 0.024 0 0 0 0 0.043 0 0 0 0 0.094 -0.33 -0.33 -0.34 0 1');

export function SurfaceGrain({ tone }: SurfaceGrainProps) {
  const isDark = tone === 'dark';

  return (
    <div
      aria-hidden="true"
      className={
        isDark
          ? 'pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-overlay'
          : 'pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply'
      }
      style={{ backgroundImage: isDark ? LIGHT_SPECKS : DARK_SPECKS }}
    />
  );
}
