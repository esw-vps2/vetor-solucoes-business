import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SurfaceGrain } from './surface-grain';

describe('SurfaceGrain', () => {
  it('uses light specks and overlay blending on dark surfaces', () => {
    const { container } = render(<SurfaceGrain tone="dark" />);
    const overlay = container.firstElementChild as HTMLElement;

    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(overlay).toHaveClass('mix-blend-overlay');
    expect(overlay.style.backgroundImage).toContain('0.941');
  });

  it('uses dark specks and multiply blending on light surfaces', () => {
    const { container } = render(<SurfaceGrain tone="light" />);
    const overlay = container.firstElementChild as HTMLElement;

    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(overlay).toHaveClass('mix-blend-multiply');
    expect(overlay.style.backgroundImage).toContain('0.024');
  });
});
