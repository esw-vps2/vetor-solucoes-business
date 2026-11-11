import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'proj-1' }),
  usePathname: () => '/portal',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/font/google', () => ({
  Plus_Jakarta_Sans: () => ({ className: 'font-plus-jakarta-sans' }),
}));

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  }),
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: () => ({
    clearRect() {},
    createRadialGradient: () => ({
      addColorStop() {},
    }),
    beginPath() {},
    arc() {},
    fill() {},
    fillStyle: '',
  }),
});

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
});
