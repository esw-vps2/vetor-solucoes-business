import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Projects } from './projects';

describe('Projects', () => {
  it('uses the supplied Medical Bills image', () => {
    render(<Projects />);

    const source = screen.getByAltText('Screenshot do projeto MEDICAL BILLS').getAttribute('src');

    expect(source).not.toBeNull();
    expect(decodeURIComponent(source ?? '')).toContain('/brand/project-medicalbills.png');
  });
});
