import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrollToHash } from './scroll-to-hash';

describe('scrollToHash', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('scrolls to the element that matches the hash', () => {
    const section = document.createElement('section');
    section.id = 'origem';
    section.scrollIntoView = vi.fn();
    document.body.appendChild(section);
    const pushState = vi.spyOn(history, 'pushState');

    scrollToHash('#origem');

    expect(section.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(pushState).toHaveBeenCalledWith(null, '', '#origem');
  });

  it('does nothing when the hash has no matching element', () => {
    const pushState = vi.spyOn(history, 'pushState');

    scrollToHash('#missing');

    expect(pushState).not.toHaveBeenCalled();
  });
});
