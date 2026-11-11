function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function scrollToHash(href: string) {
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth';

  if (href === '#' || href === '') {
    window.scrollTo({ top: 0, behavior });
    history.pushState(null, '', `${window.location.pathname}${window.location.search}`);
    return;
  }

  if (!href.startsWith('#')) {
    return;
  }

  const target = document.getElementById(href.slice(1));
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior, block: 'start' });
  history.pushState(null, '', href);
}
